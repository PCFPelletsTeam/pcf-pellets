import type {
  CalculationLineResult,
  EmissionFactorSnapshot,
  PCFCalculation,
  PCFCalculationInput,
} from '@pcf/shared';
import type { CalculationLineEntity } from './entities/calculation-line.entity';
import type { PCFCalculationEntity } from './entities/pcf-calculation.entity';

export function toCalculationLine(
  entity: CalculationLineEntity,
): CalculationLineResult {
  return {
    inputItemId: entity.inputItemId,
    emissionFactor: JSON.parse(
      entity.emissionFactorSnapshotJson,
    ) as EmissionFactorSnapshot,
    scope: entity.scope,
    emissionsKgCo2e: entity.emissionsKgCo2e,
  };
}

export function toCalculation(
  entity: PCFCalculationEntity,
  lines: CalculationLineEntity[],
): PCFCalculation {
  const input: PCFCalculationInput = {
    period: {
      startDate: entity.periodStart,
      endDate: entity.periodEnd,
      label: entity.periodLabel ?? undefined,
    },
    mode: entity.mode,
    facilityName: entity.facilityName,
    items: entity.parseInputItems(),
    process: entity.parseProcessParameters(),
    notes: entity.notes ?? undefined,
  };

  return {
    id: entity.id,
    input,
    pcfKgCo2ePerKgPellets: entity.pcfKgCo2ePerKgPellets,
    breakdown: {
      scope1KgCo2e: entity.breakdownScope1KgCo2e,
      scope2KgCo2e: entity.breakdownScope2KgCo2e,
      scope3KgCo2e: entity.breakdownScope3KgCo2e,
      totalKgCo2e: entity.breakdownTotalKgCo2e,
    },
    lines: lines.map(toCalculationLine),
    methodologyVersion: entity.methodologyVersion,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}
