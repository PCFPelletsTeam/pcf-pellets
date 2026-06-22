import type { Material } from '@pcf/shared';
import type { MaterialEntity } from './entities/material.entity';

/**
 * Entity → API-форма (shared `Material`).
 *
 * Окрема mapping-функція — це явна межа persistence ↔ API. Якщо завтра з'явиться
 * приватне поле в entity (наприклад, `internalCode`) — воно не витече назовні
 * автоматично через серіалізацію.
 */
export function toMaterial(entity: MaterialEntity): Material {
  return {
    id: entity.id,
    name: entity.name,
    category: entity.category,
    defaultUnit: entity.defaultUnit,
    description: entity.description ?? undefined,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}
