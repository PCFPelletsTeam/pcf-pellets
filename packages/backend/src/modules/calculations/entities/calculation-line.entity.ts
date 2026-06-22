import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type {
  DecimalString,
  EmissionFactorSnapshot,
  GhgScope,
} from '@pcf/shared';
import { PCFCalculationEntity } from './pcf-calculation.entity';

/**
 * Один рядок результату — внесок одного input item у фінальний PCF.
 *
 * **Audit trail:** `emission_factor_snapshot_json` зберігає **повну копію** EF
 * на момент розрахунку (не FK на emission_factors!). Це гарантує відтворюваність
 * історичних звітів навіть після оновлення EF DB — обов'язкова вимога ISO 14067 і CBAM.
 */
@Entity({ name: 'calculation_lines' })
@Index('idx_calculation_lines_calculation', ['calculationId'])
@Index('idx_calculation_lines_scope', ['scope'])
export class CalculationLineEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 36, name: 'calculation_id' })
  calculationId!: string;

  /** UUID input item з frontend — для зв'язку результату з первинним рядком форми. */
  @Column({ type: 'varchar', length: 36, name: 'input_item_id' })
  inputItemId!: string;

  @Column({ type: 'varchar', length: 20 })
  scope!: GhgScope;

  /** Викиди по цьому рядку, kg CO₂e (string для точності). */
  @Column({ type: 'text', name: 'emissions_kg_co2e' })
  emissionsKgCo2e!: DecimalString;

  /** JSON: EmissionFactorSnapshot — frozen копія EF, що використана. */
  @Column({ type: 'text', name: 'emission_factor_snapshot_json' })
  emissionFactorSnapshotJson!: string;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt!: Date;

  // --- Relations ---
  @ManyToOne(() => PCFCalculationEntity, (calc) => calc.lines, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'calculation_id' })
  calculation!: PCFCalculationEntity;

  parseEmissionFactorSnapshot(): EmissionFactorSnapshot {
    return JSON.parse(
      this.emissionFactorSnapshotJson,
    ) as EmissionFactorSnapshot;
  }
}
