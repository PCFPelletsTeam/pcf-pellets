import { CalculationLineEntity } from '../modules/calculations/entities/calculation-line.entity';
import { PCFCalculationEntity } from '../modules/calculations/entities/pcf-calculation.entity';
import { EmissionFactorEntity } from '../modules/emission-factors/entities/emission-factor.entity';
import { MaterialEntity } from '../modules/materials/entities/material.entity';
import { ReportEntity } from '../modules/reports/entities/report.entity';

/**
 * Єдиний список TypeORM-сутностей — щоб і CLI DataSource (`data-source.ts`),
 * і runtime `TypeOrmModule.forRootAsync` бачили одне й те ж.
 */
export const ENTITIES = [
  MaterialEntity,
  EmissionFactorEntity,
  PCFCalculationEntity,
  CalculationLineEntity,
  ReportEntity,
];
