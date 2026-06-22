import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type {
  CalculationInputItem,
  CalculationMode,
  DecimalString,
  ProcessParameters,
} from '@pcf/shared';
import { CalculationLineEntity } from './calculation-line.entity';

/**
 * Основна сутність PCF-розрахунку.
 *
 * Дизайн:
 *  - `input_items_json` зберігає raw input (CalculationInputItem[]) як JSON,
 *    бо це user-side data — не потребує реляційних запитів і дозволяє
 *    зберігати точну копію того, що ввів еколог.
 *  - `lines` (окрема таблиця `calculation_lines`) — це **результат розрахунку**
 *    з EF snapshot'ами для audit trail.
 *  - Усі числові поля — TEXT (decimal as string).
 */
@Entity({ name: 'pcf_calculations' })
@Index('idx_pcf_calculations_mode', ['mode'])
@Index('idx_pcf_calculations_period', ['periodStart', 'periodEnd'])
@Index('idx_pcf_calculations_facility', ['facilityName'])
export class PCFCalculationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /** ISO_14067 (з Scope 3) або CBAM (тільки Scope 1+2). */
  @Column({ type: 'varchar', length: 20 })
  mode!: CalculationMode;

  @Column({ type: 'varchar', length: 200, name: 'facility_name' })
  facilityName!: string;

  /** ISO `YYYY-MM-DD`. */
  @Column({ type: 'varchar', length: 10, name: 'period_start' })
  periodStart!: string;

  @Column({ type: 'varchar', length: 10, name: 'period_end' })
  periodEnd!: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    name: 'period_label',
  })
  periodLabel!: string | null;

  /** JSON: CalculationInputItem[] — вхідні дані як їх ввів еколог. */
  @Column({ type: 'text', name: 'input_items_json' })
  inputItemsJson!: string;

  /** JSON: ProcessParameters (output mass + technological losses). */
  @Column({ type: 'text', name: 'process_parameters_json' })
  processParametersJson!: string;

  // --- Підсумки (DecimalString as TEXT) ---
  @Column({ type: 'text', name: 'breakdown_scope1_kg_co2e' })
  breakdownScope1KgCo2e!: DecimalString;

  @Column({ type: 'text', name: 'breakdown_scope2_kg_co2e' })
  breakdownScope2KgCo2e!: DecimalString;

  /** У режимі CBAM завжди `"0"`. */
  @Column({ type: 'text', name: 'breakdown_scope3_kg_co2e' })
  breakdownScope3KgCo2e!: DecimalString;

  @Column({ type: 'text', name: 'breakdown_total_kg_co2e' })
  breakdownTotalKgCo2e!: DecimalString;

  /** Підсумковий PCF: kg CO₂e / kg продукції. */
  @Column({ type: 'text', name: 'pcf_kg_co2e_per_kg_pellets' })
  pcfKgCo2ePerKgPellets!: DecimalString;

  /** semver версія калькулятора (для відтворюваності). */
  @Column({ type: 'varchar', length: 20, name: 'methodology_version' })
  methodologyVersion!: string;

  @Column({ type: 'text', nullable: true })
  notes!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt!: Date;

  // --- Relations ---
  @OneToMany(() => CalculationLineEntity, (line) => line.calculation, {
    cascade: ['insert'],
  })
  lines!: CalculationLineEntity[];

  // --- Зручні десеріалізатори (без autoload, викликати у service) ---
  parseInputItems(): CalculationInputItem[] {
    return JSON.parse(this.inputItemsJson) as CalculationInputItem[];
  }

  parseProcessParameters(): ProcessParameters {
    return JSON.parse(this.processParametersJson) as ProcessParameters;
  }
}
