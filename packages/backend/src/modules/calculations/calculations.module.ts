import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmissionFactorEntity } from '../emission-factors/entities/emission-factor.entity';
import { EmissionFactorsModule } from '../emission-factors/emission-factors.module';
import { MaterialsModule } from '../materials/materials.module';
import { CalculationsController } from './calculations.controller';
import { CalculationsService } from './calculations.service';
import { CalculationLineEntity } from './entities/calculation-line.entity';
import { PCFCalculationEntity } from './entities/pcf-calculation.entity';
import { CalculationEngine } from './engine/calculation.engine';
import { EmissionFactorSelectorService } from './engine/ef-selector.service';
import { UnitConversionService } from './engine/units.service';

@Module({
  imports: [
    // Власні entities + EmissionFactorEntity (потрібен EF selector'у напряму).
    TypeOrmModule.forFeature([
      PCFCalculationEntity,
      CalculationLineEntity,
      EmissionFactorEntity,
    ]),
    MaterialsModule,
    EmissionFactorsModule,
  ],
  controllers: [CalculationsController],
  providers: [
    CalculationsService,
    UnitConversionService,
    EmissionFactorSelectorService,
    CalculationEngine,
  ],
  exports: [CalculationsService, UnitConversionService, CalculationEngine],
})
export class CalculationsModule {}
