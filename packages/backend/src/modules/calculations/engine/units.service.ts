import { BadRequestException, Injectable } from '@nestjs/common';
import { Decimal } from 'decimal.js';
import { Unit } from '@pcf/shared';
import './decimal-config';

/**
 * Класи одиниць — конверсія дозволена тільки **усередині** одного класу.
 * Спроба конвертувати mass→energy кидає `BadRequestException`.
 */
const enum UnitClass {
  Mass = 'mass',
  Energy = 'energy',
  Volume = 'volume',
}

/**
 * Коефіцієнт у **базову одиницю** класу (kg для mass, kWh для energy, m³ для volume).
 *
 * Енергія: 1 kWh = 3.6 MJ (рівно). 1 GJ = 1000 MJ ≈ 277.777... kWh.
 * Тому MJ→kWh = 1/3.6, а GJ→kWh = 1000/3.6 — точно.
 */
const TO_BASE: Record<Unit, { class: UnitClass; toBase: string }> = {
  [Unit.KG]: { class: UnitClass.Mass, toBase: '1' },
  [Unit.TONNE]: { class: UnitClass.Mass, toBase: '1000' },
  [Unit.KWH]: { class: UnitClass.Energy, toBase: '1' },
  [Unit.MWH]: { class: UnitClass.Energy, toBase: '1000' },
  [Unit.MJ]: {
    class: UnitClass.Energy,
    toBase: '0.2777777777777777777777777778',
  }, // 1/3.6
  [Unit.GJ]: {
    class: UnitClass.Energy,
    toBase: '277.7777777777777777777777777778',
  }, // 1000/3.6
  [Unit.M3]: { class: UnitClass.Volume, toBase: '1' },
  [Unit.LITRE]: { class: UnitClass.Volume, toBase: '0.001' },
};

@Injectable()
export class UnitConversionService {
  /**
   * Повертає множник для конверсії з `from` у `to` всередині одного класу.
   * Кидає `BadRequestException`, якщо одиниці з різних класів.
   */
  factor(from: Unit, to: Unit): Decimal {
    if (from === to) return new Decimal(1);

    const fromMeta = TO_BASE[from];
    const toMeta = TO_BASE[to];
    if (!fromMeta || !toMeta) {
      throw new BadRequestException(`Невідома одиниця: ${from} або ${to}`);
    }
    if (fromMeta.class !== toMeta.class) {
      throw new BadRequestException(
        `Не можна конвертувати ${from} (${fromMeta.class}) → ${to} (${toMeta.class}). ` +
          `Перевірте, що EF задано у тому ж класі одиниць, що й input.`,
      );
    }

    // value_in_base = quantity * fromMeta.toBase
    // value_in_to   = value_in_base / toMeta.toBase
    return new Decimal(fromMeta.toBase).div(new Decimal(toMeta.toBase));
  }

  /**
   * Конвертує `quantity` з `from` у `to`. quantity може бути string|number|Decimal.
   */
  convert(quantity: string | number | Decimal, from: Unit, to: Unit): Decimal {
    return new Decimal(quantity).mul(this.factor(from, to));
  }
}
