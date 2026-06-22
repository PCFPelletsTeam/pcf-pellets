import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import type {
  DecimalString,
  ElectricitySource,
  GhgScope,
  MaterialCategory,
  Unit,
} from '@pcf/shared';

/**
 * Emission Factor у БД.
 *
 * Числові значення (`value`, `uncertaintyPercent`) зберігаються як TEXT —
 * SQLite не має decimal-типу, а `Number` втрачає точність. На read'і парсимо
 * через `new Decimal(...)` у service-шарі.
 */
@Entity({ name: 'emission_factors' })
@Unique('uq_emission_factors_key', ['key'])
@Index('idx_emission_factors_category', ['category'])
@Index('idx_emission_factors_year', ['year'])
export class EmissionFactorEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** Бізнес-ключ ("ELECTRICITY_UA_GRID_AVG", "NG_COMBUSTION", "BENTONITE_PRODUCTION"). */
  @Column({ type: 'varchar', length: 100 })
  key!: string;

  @Column({ type: 'varchar', length: 200 })
  name!: string;

  @Column({ type: 'varchar', length: 50 })
  category!: MaterialCategory;

  /** kg CO₂e на одну `unit`, як string. */
  @Column({ type: 'text' })
  value!: DecimalString;

  @Column({ type: 'varchar', length: 10 })
  unit!: Unit;

  @Column({ type: 'varchar', length: 20 })
  scope!: GhgScope;

  /** Тільки для category=ELECTRICITY — конкретний UA-варіант. */
  @Column({
    type: 'varchar',
    length: 30,
    nullable: true,
    name: 'electricity_source',
  })
  electricitySource!: ElectricitySource | null;

  /** Назва джерела даних: "DEFRA 2024", "EU CBAM Default", "Operator measured". */
  @Column({ type: 'varchar', length: 200 })
  source!: string;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'source_url' })
  sourceUrl!: string | null;

  @Column({ type: 'integer' })
  year!: number;

  /** ISO `YYYY-MM-DD` (опціонально, межі застосовності). */
  @Column({ type: 'varchar', length: 10, nullable: true, name: 'valid_from' })
  validFrom!: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true, name: 'valid_until' })
  validUntil!: string | null;

  /** ISO-3166 alpha-2 ("UA", "EU") або "GLOBAL". */
  @Column({ type: 'varchar', length: 10 })
  region!: string;

  /** Невизначеність U±% як string-decimal, опціонально (для ISO 14067). */
  @Column({ type: 'text', nullable: true, name: 'uncertainty_percent' })
  uncertaintyPercent!: DecimalString | null;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt!: Date;
}
