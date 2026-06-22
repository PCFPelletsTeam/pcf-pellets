import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  type FindOptionsWhere,
  ILike,
  In,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import type {
  CalculationInputItem,
  DecimalString,
  Paginated,
  PCFCalculation,
  PCFCalculationInput,
  ProcessParameters,
} from '@pcf/shared';
import type { CreateCalculationDto } from './dto/create-calculation.dto';
import type { ListCalculationsQueryDto } from './dto/list-calculations.query';
import { CalculationLineEntity } from './entities/calculation-line.entity';
import { PCFCalculationEntity } from './entities/pcf-calculation.entity';
import { toCalculation } from './calculations.mapper';
import { CalculationEngine } from './engine/calculation.engine';
import { EmissionFactorSelectorService } from './engine/ef-selector.service';
import { METHODOLOGY_VERSION } from './engine/methodology';

@Injectable()
export class CalculationsService {
  private readonly logger = new Logger(CalculationsService.name);

  constructor(
    @InjectRepository(PCFCalculationEntity)
    private readonly calcRepo: Repository<PCFCalculationEntity>,
    @InjectRepository(CalculationLineEntity)
    private readonly linesRepo: Repository<CalculationLineEntity>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly efSelector: EmissionFactorSelectorService,
    private readonly engine: CalculationEngine,
  ) {}

  async list(
    query: ListCalculationsQueryDto,
  ): Promise<Paginated<PCFCalculation>> {
    const where: FindOptionsWhere<PCFCalculationEntity> = {
      ...(query.mode ? { mode: query.mode } : {}),
      ...(query.facilityName
        ? { facilityName: ILike(`%${query.facilityName}%`) }
        : {}),
      ...this.buildPeriodFilter(query.periodFrom, query.periodTo),
    };

    const [items, total] = await this.calcRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    });

    const ids = items.map((c) => c.id);
    const allLines = ids.length
      ? await this.linesRepo.find({ where: { calculationId: In(ids) } })
      : [];
    const linesByCalcId = new Map<string, CalculationLineEntity[]>();
    for (const line of allLines) {
      const arr = linesByCalcId.get(line.calculationId) ?? [];
      arr.push(line);
      linesByCalcId.set(line.calculationId, arr);
    }

    return {
      items: items.map((calc) =>
        toCalculation(calc, linesByCalcId.get(calc.id) ?? []),
      ),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  async findOne(id: string): Promise<PCFCalculation> {
    const calc = await this.calcRepo.findOne({ where: { id } });
    if (!calc) {
      throw new NotFoundException(`Розрахунок з id=${id} не знайдено`);
    }
    const lines = await this.linesRepo.find({
      where: { calculationId: id },
      order: { createdAt: 'ASC' },
    });
    return toCalculation(calc, lines);
  }

  /**
   * Створення нового PCF-розрахунку:
   *   1. Вибрати EF для кожного input item (DB read).
   *   2. Запустити engine — pure math, snapshot EF, breakdown за scope.
   *   3. Persist у транзакції: pcf_calculations + N×calculation_lines.
   */
  async create(dto: CreateCalculationDto): Promise<PCFCalculation> {
    // Brand cast string → DecimalString. Валідація формату вже зроблена @Matches у DTO,
    // тому каст безпечний — branded тип лише для compile-time guard'у.
    const items: CalculationInputItem[] = dto.items.map((item) => ({
      id: item.id,
      materialId: item.materialId,
      category: item.category,
      quantity: item.quantity as DecimalString,
      unit: item.unit,
      electricitySource: item.electricitySource,
      notes: item.notes,
    }));
    const process: ProcessParameters = {
      outputMass: dto.process.outputMass as DecimalString,
      outputMassUnit: dto.process.outputMassUnit,
      technologicalLossesPercent: dto.process.technologicalLossesPercent as
        | DecimalString
        | undefined,
      productionLineName: dto.process.productionLineName,
    };
    const input: PCFCalculationInput = {
      period: dto.period,
      mode: dto.mode,
      facilityName: dto.facilityName,
      items,
      process,
      notes: dto.notes,
    };

    const efByItemId = await this.efSelector.selectForAll(input.items);
    const result = this.engine.calculate(input, efByItemId);

    const saved = await this.dataSource.transaction(async (manager) => {
      const calcEntity = manager.create(PCFCalculationEntity, {
        mode: input.mode,
        facilityName: input.facilityName,
        periodStart: input.period.startDate,
        periodEnd: input.period.endDate,
        periodLabel: input.period.label ?? null,
        inputItemsJson: JSON.stringify(input.items),
        processParametersJson: JSON.stringify(input.process),
        breakdownScope1KgCo2e: result.breakdown.scope1KgCo2e,
        breakdownScope2KgCo2e: result.breakdown.scope2KgCo2e,
        breakdownScope3KgCo2e: result.breakdown.scope3KgCo2e,
        breakdownTotalKgCo2e: result.breakdown.totalKgCo2e,
        pcfKgCo2ePerKgPellets: result.pcfKgCo2ePerKgPellets,
        methodologyVersion: METHODOLOGY_VERSION,
        notes: input.notes ?? null,
      });
      const savedCalc = await manager.save(calcEntity);

      const lineEntities = result.lines.map((line) =>
        manager.create(CalculationLineEntity, {
          calculationId: savedCalc.id,
          inputItemId: line.inputItemId,
          scope: line.scope,
          emissionsKgCo2e: line.emissionsKgCo2e,
          emissionFactorSnapshotJson: JSON.stringify(line.emissionFactor),
        }),
      );
      const savedLines = await manager.save(lineEntities);

      return { savedCalc, savedLines };
    });

    this.logger.log(
      `Створено PCF-розрахунок ${saved.savedCalc.id}: mode=${input.mode}, ` +
        `items=${input.items.length}, lines=${saved.savedLines.length}, ` +
        `PCF=${result.pcfKgCo2ePerKgPellets} kg CO₂e/kg`,
    );

    return toCalculation(saved.savedCalc, saved.savedLines);
  }

  async remove(id: string): Promise<void> {
    const result = await this.calcRepo.delete({ id });
    if (result.affected === 0) {
      throw new NotFoundException(`Розрахунок з id=${id} не знайдено`);
    }
  }

  private buildPeriodFilter(
    from?: string,
    to?: string,
  ): FindOptionsWhere<PCFCalculationEntity> {
    if (from && to) {
      return {
        periodEnd: MoreThanOrEqual(from),
        periodStart: LessThanOrEqual(to),
      };
    }
    if (from) return { periodEnd: MoreThanOrEqual(from) };
    if (to) return { periodStart: LessThanOrEqual(to) };
    return {};
  }
}
