import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { MaterialCategory, Unit } from '@pcf/shared';

/**
 * Довідник матеріалів і енергоносіїв (master data).
 * Категорія використовується для фільтрації відповідних EF.
 */
@Entity({ name: 'materials' })
@Index('idx_materials_category', ['category'])
export class MaterialEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 200 })
  name!: string;

  /** Зберігається як string (значення enum з @pcf/shared). */
  @Column({ type: 'varchar', length: 50 })
  category!: MaterialCategory;

  @Column({ type: 'varchar', length: 10, name: 'default_unit' })
  defaultUnit!: Unit;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt!: Date;
}
