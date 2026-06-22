import { type EmissionFactor, type EmissionFactorSnapshot } from '@pcf/shared';
import type { EmissionFactorEntity } from './entities/emission-factor.entity';

export function toEmissionFactor(entity: EmissionFactorEntity): EmissionFactor {
  return {
    id: entity.id,
    key: entity.key,
    name: entity.name,
    category: entity.category,
    value: entity.value,
    unit: entity.unit,
    scope: entity.scope,
    electricitySource: entity.electricitySource ?? undefined,
    source: entity.source,
    sourceUrl: entity.sourceUrl ?? undefined,
    year: entity.year,
    validFrom: entity.validFrom ?? undefined,
    validUntil: entity.validUntil ?? undefined,
    region: entity.region,
    uncertaintyPercent: entity.uncertaintyPercent ?? undefined,
    notes: entity.notes ?? undefined,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}

/**
 * Створює immutable snapshot EF — frozen-копія для запису у calculation_lines.
 * Це і є audit trail: розрахунок навіки прив'язаний до EF saw в момент розрахунку,
 * незалежно від подальших оновлень EF DB.
 */
export function toEmissionFactorSnapshot(
  entity: EmissionFactorEntity,
): EmissionFactorSnapshot {
  const ef = toEmissionFactor(entity);
  // Видаляємо timestamps — вони про запис у БД, не про сам EF.
  const { createdAt: _c, updatedAt: _u, ...factorOnly } = ef;
  void _c;
  void _u;
  return {
    ...factorOnly,
    originalEmissionFactorId: entity.id,
    capturedAt: new Date().toISOString(),
  };
}
