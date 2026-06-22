import { BadRequestException, Injectable } from '@nestjs/common';
import { Decimal } from 'decimal.js';
import {
  CalculationMode,
  type CalculationLineResult,
  type DecimalString,
  GhgScope,
  type PCFCalculationInput,
  type ScopeBreakdown,
  Unit,
} from '@pcf/shared';
import { EmissionFactorEntity } from '../../emission-factors/entities/emission-factor.entity';
import { toEmissionFactorSnapshot } from '../../emission-factors/emission-factors.mapper';
import './decimal-config';
import { UnitConversionService } from './units.service';

export interface EngineResult {
  pcfKgCo2ePerKgPellets: DecimalString;
  breakdown: ScopeBreakdown;
  lines: CalculationLineResult[];
}

/**
 * Чистий обчислювальний сервіс — без БД, без транзакцій.
 *
 * Алгоритм:
 *   1. Для кожного input item:
 *      a. Якщо mode=CBAM і EF.scope=SCOPE_3 — пропустити (взагалі без line у результаті).
 *      b. Конвертувати quantity з item.unit → ef.unit (всередині класу).
 *      c. emissions = quantityInEfUnit × EF.value (Decimal multiplication).
 *      d. Зробити **immutable snapshot** EF (audit trail).
 *      e. Додати рядок результату; накопичити суму у відповідному scope.
 *   2. PCF = (scope1 + scope2 + scope3) / outputMassKg.
 *      - У режимі CBAM scope3 завжди 0 (бо ми пропустили відповідні EF).
 *      - outputMass конвертується з вказаної unit у kg.
 *
 * Вся арифметика — через `decimal.js` (precision=30), результати серіалізуються
 * як `toFixed()` (без exponential notation), щоб у БД лягав рядок-decimal без втрат.
 */
@Injectable()
export class CalculationEngine {
  constructor(private readonly units: UnitConversionService) {}

  calculate(
    input: PCFCalculationInput,
    efByItemId: ReadonlyMap<string, EmissionFactorEntity>,
  ): EngineResult {
    const lines: CalculationLineResult[] = [];
    let scope1 = new Decimal(0);
    let scope2 = new Decimal(0);
    let scope3 = new Decimal(0);

    for (const item of input.items) {
      const ef = efByItemId.get(item.id);
      if (!ef) {
        // Не повинно статись, якщо selector відпрацював — але краще явна помилка ніж NPE.
        throw new Error(`Internal: EF не вибрано для input item ${item.id}`);
      }

      // CBAM ігнорує Scope 3 повністю — рядок навіть не з'являється в результаті.
      if (
        input.mode === CalculationMode.CBAM &&
        ef.scope === GhgScope.SCOPE_3
      ) {
        continue;
      }

      // Конвертація input.quantity (item.unit) → ef.unit, з валідацією класу одиниць.
      const factor = this.units.factor(item.unit, ef.unit);
      const qtyInEfUnit = new Decimal(item.quantity).mul(factor);
      const efValue = new Decimal(ef.value);
      const emissions = qtyInEfUnit.mul(efValue);

      lines.push({
        inputItemId: item.id,
        emissionFactor: toEmissionFactorSnapshot(ef),
        scope: ef.scope,
        emissionsKgCo2e: emissions.toFixed() as DecimalString,
      });

      switch (ef.scope) {
        case GhgScope.SCOPE_1:
          scope1 = scope1.plus(emissions);
          break;
        case GhgScope.SCOPE_2:
          scope2 = scope2.plus(emissions);
          break;
        case GhgScope.SCOPE_3:
          scope3 = scope3.plus(emissions);
          break;
      }
    }

    const total = scope1.plus(scope2).plus(scope3);

    // Знаменник: маса виробленого продукту у кг.
    const outputMassKg = this.units.convert(
      input.process.outputMass,
      input.process.outputMassUnit,
      Unit.KG,
    );
    if (outputMassKg.lte(0)) {
      throw new BadRequestException(
        `process.outputMass має бути > 0 (отримано ${input.process.outputMass} ${input.process.outputMassUnit})`,
      );
    }

    const pcf = total.div(outputMassKg);

    return {
      pcfKgCo2ePerKgPellets: pcf.toFixed() as DecimalString,
      breakdown: {
        scope1KgCo2e: scope1.toFixed() as DecimalString,
        scope2KgCo2e: scope2.toFixed() as DecimalString,
        scope3KgCo2e: scope3.toFixed() as DecimalString,
        totalKgCo2e: total.toFixed() as DecimalString,
      },
      lines,
    };
  }
}
