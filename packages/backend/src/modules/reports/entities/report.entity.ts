import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { ReportFormat } from '@pcf/shared';
import { PCFCalculationEntity } from '../../calculations/entities/pcf-calculation.entity';

/**
 * Метадані згенерованого звіту (PDF/CSV/JSON).
 * Файл фізично лежить на disk у `REPORTS_DIR`; `file_path` — відносний шлях.
 */
@Entity({ name: 'reports' })
@Index('idx_reports_calculation', ['calculationId'])
@Index('idx_reports_format', ['format'])
export class ReportEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 36, name: 'calculation_id' })
  calculationId!: string;

  @Column({ type: 'varchar', length: 30 })
  format!: ReportFormat;

  /** Відносний шлях у REPORTS_DIR — наприклад `2026-Q1/calc-abc123.pdf`. */
  @Column({ type: 'varchar', length: 500, name: 'file_path' })
  filePath!: string;

  @Column({ type: 'integer', name: 'size_bytes' })
  sizeBytes!: number;

  /** SHA-256 hex (для перевірки цілісності файлу). */
  @Column({ type: 'varchar', length: 64, name: 'content_hash' })
  contentHash!: string;

  /** Локаль звіту — 'uk' або 'en'. */
  @Column({ type: 'varchar', length: 5, nullable: true })
  locale!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt!: Date;

  // --- Relations ---
  @ManyToOne(() => PCFCalculationEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'calculation_id' })
  calculation!: PCFCalculationEntity;
}
