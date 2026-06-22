import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CalculationsModule } from '../calculations/calculations.module';
import { ReportEntity } from './entities/report.entity';
import {
  CsvCbamGenerator,
  JsonCx0029Generator,
  PdfIso14067Generator,
} from './generators';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { ReportStorageService } from './report-storage.service';

@Module({
  imports: [TypeOrmModule.forFeature([ReportEntity]), CalculationsModule],
  controllers: [ReportsController],
  providers: [
    ReportsService,
    ReportStorageService,
    PdfIso14067Generator,
    CsvCbamGenerator,
    JsonCx0029Generator,
  ],
  exports: [ReportsService],
})
export class ReportsModule {}
