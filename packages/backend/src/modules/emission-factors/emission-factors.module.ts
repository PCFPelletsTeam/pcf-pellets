import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmissionFactorEntity } from './entities/emission-factor.entity';
import { EmissionFactorsController } from './emission-factors.controller';
import { EmissionFactorsService } from './emission-factors.service';
import { EmissionFactorsSeeder } from './seeders/emission-factors.seeder';

@Module({
  imports: [TypeOrmModule.forFeature([EmissionFactorEntity])],
  controllers: [EmissionFactorsController],
  providers: [EmissionFactorsService, EmissionFactorsSeeder],
  exports: [EmissionFactorsService],
})
export class EmissionFactorsModule {}
