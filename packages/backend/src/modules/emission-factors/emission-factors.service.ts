import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type {
  EmissionFactor,
  EmissionFactorSnapshot,
  Paginated,
} from '@pcf/shared';
import type { ListEmissionFactorsQueryDto } from './dto/list-emission-factors.query';
import { EmissionFactorEntity } from './entities/emission-factor.entity';
import {
  toEmissionFactor,
  toEmissionFactorSnapshot,
} from './emission-factors.mapper';

@Injectable()
export class EmissionFactorsService {
  constructor(
    @InjectRepository(EmissionFactorEntity)
    private readonly efRepo: Repository<EmissionFactorEntity>,
  ) {}

  async list(
    query: ListEmissionFactorsQueryDto,
  ): Promise<Paginated<EmissionFactor>> {
    const where = {
      ...(query.category ? { category: query.category } : {}),
      ...(query.scope ? { scope: query.scope } : {}),
      ...(query.electricitySource
        ? { electricitySource: query.electricitySource }
        : {}),
      ...(query.region ? { region: query.region } : {}),
      ...(query.year ? { year: query.year } : {}),
    };
    const [items, total] = await this.efRepo.findAndCount({
      where,
      order: { category: 'ASC', key: 'ASC' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    });
    return {
      items: items.map(toEmissionFactor),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  async findByKey(key: string): Promise<EmissionFactor> {
    const entity = await this.efRepo.findOne({ where: { key } });
    if (!entity) {
      throw new NotFoundException(`EF з key="${key}" не знайдено`);
    }
    return toEmissionFactor(entity);
  }

  async findOne(id: string): Promise<EmissionFactor> {
    const entity = await this.efRepo.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException(`EF з id=${id} не знайдено`);
    }
    return toEmissionFactor(entity);
  }

  /**
   * Дістати EF + одразу зробити snapshot для audit trail.
   * Викликається з CalculationsService під час розрахунку.
   */
  async getSnapshotByKey(key: string): Promise<EmissionFactorSnapshot> {
    const entity = await this.efRepo.findOne({ where: { key } });
    if (!entity) {
      throw new NotFoundException(`EF з key="${key}" не знайдено для snapshot`);
    }
    return toEmissionFactorSnapshot(entity);
  }

  async count(): Promise<number> {
    return this.efRepo.count();
  }

  async bulkInsert(entities: Partial<EmissionFactorEntity>[]): Promise<void> {
    const created = entities.map((data) => this.efRepo.create(data));
    await this.efRepo.save(created);
  }
}
