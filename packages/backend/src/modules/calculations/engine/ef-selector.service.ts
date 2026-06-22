import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { type CalculationInputItem, MaterialCategory } from '@pcf/shared';
import { EmissionFactorEntity } from '../../emission-factors/entities/emission-factor.entity';

/**
 * Вибирає EF, який треба застосувати до конкретного `CalculationInputItem`.
 *
 * Правила:
 *   - Для `category=ELECTRICITY` обов'язковий `electricitySource` —
 *     EF шукається з матчем по обидвох полях.
 *   - Для всіх інших категорій береться EF з найновішим `year`.
 *   - Якщо EF не знайдено — `BadRequestException` із зрозумілим повідомленням
 *     (а не 500), бо це user input issue.
 *
 * Окремий сервіс, бо логіка вибору EF — це доменне рішення, що може
 * розширитись (вибір по region, операторський override, multi-source mix).
 */
@Injectable()
export class EmissionFactorSelectorService {
  constructor(
    @InjectRepository(EmissionFactorEntity)
    private readonly efRepo: Repository<EmissionFactorEntity>,
  ) {}

  async selectFor(item: CalculationInputItem): Promise<EmissionFactorEntity> {
    if (item.category === MaterialCategory.ELECTRICITY) {
      if (!item.electricitySource) {
        throw new BadRequestException(
          `Для category=ELECTRICITY (item ${item.id}) обов'язкове поле electricitySource ` +
            `(UA_GRID_AVG / UA_NUCLEAR_PPA / UA_COAL).`,
        );
      }
      const ef = await this.efRepo.findOne({
        where: {
          category: MaterialCategory.ELECTRICITY,
          electricitySource: item.electricitySource,
        },
        order: { year: 'DESC' },
      });
      if (!ef) {
        throw new BadRequestException(
          `EF для ELECTRICITY/${item.electricitySource} не знайдено в БД. ` +
            `Перевірте seed або додайте відповідний EF.`,
        );
      }
      return ef;
    }

    const ef = await this.efRepo.findOne({
      where: { category: item.category },
      order: { year: 'DESC' },
    });
    if (!ef) {
      throw new BadRequestException(
        `EF для category=${item.category} (item ${item.id}) не знайдено в БД.`,
      );
    }
    return ef;
  }

  /**
   * Batch-вибір — повертає map по item.id. Викликається з CalculationsService.create()
   * щоб не робити N окремих запитів послідовно.
   */
  async selectForAll(
    items: readonly CalculationInputItem[],
  ): Promise<Map<string, EmissionFactorEntity>> {
    const map = new Map<string, EmissionFactorEntity>();
    // Поки що послідовно: items зазвичай 5–15 на калькуляцію, race-conditions немає.
    for (const item of items) {
      map.set(item.id, await this.selectFor(item));
    }
    return map;
  }
}
