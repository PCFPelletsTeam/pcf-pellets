import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaterialEntity } from './entities/material.entity';
import { MaterialsController } from './materials.controller';
import { MaterialsService } from './materials.service';
import { MaterialsSeeder } from './seeders/materials.seeder';

@Module({
  imports: [TypeOrmModule.forFeature([MaterialEntity])],
  controllers: [MaterialsController],
  providers: [MaterialsService, MaterialsSeeder],
  exports: [MaterialsService],
})
export class MaterialsModule {}
