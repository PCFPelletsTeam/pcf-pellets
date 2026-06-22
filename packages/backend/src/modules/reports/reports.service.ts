import { type ReadStream } from 'node:fs';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { type FindOptionsWhere, Repository } from 'typeorm';
import { type Paginated, type Report, ReportFormat } from '@pcf/shared';
import { CalculationsService } from '../calculations/calculations.service';
import type { GenerateReportDto } from './dto/generate-report.dto';
import type { ListReportsQueryDto } from './dto/list-reports.query';
import { ReportEntity } from './entities/report.entity';
import {
  CsvCbamGenerator,
  JsonCx0029Generator,
  PdfIso14067Generator,
  type ReportGenerator,
} from './generators';
import { ReportStorageService } from './report-storage.service';
import { toReport } from './reports.mapper';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);
  private readonly generators: Map<ReportFormat, ReportGenerator>;

  constructor(
    @InjectRepository(ReportEntity)
    private readonly reportsRepo: Repository<ReportEntity>,
    private readonly calcsService: CalculationsService,
    private readonly storage: ReportStorageService,
    pdfGen: PdfIso14067Generator,
    csvGen: CsvCbamGenerator,
    jsonGen: JsonCx0029Generator,
  ) {
    this.generators = new Map<ReportFormat, ReportGenerator>([
      [ReportFormat.PDF_ISO_14067, pdfGen],
      [ReportFormat.CSV_CBAM, csvGen],
      [ReportFormat.JSON_CX_0029, jsonGen],
    ]);
  }

  async list(query: ListReportsQueryDto): Promise<Paginated<Report>> {
    const where: FindOptionsWhere<ReportEntity> = {
      ...(query.calculationId ? { calculationId: query.calculationId } : {}),
      ...(query.format ? { format: query.format } : {}),
    };
    const [items, total] = await this.reportsRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    });
    return {
      items: items.map(toReport),
      total,
      page: query.page,
      pageSize: query.pageSize,
    };
  }

  async findOne(id: string): Promise<Report> {
    const entity = await this.reportsRepo.findOne({ where: { id } });
    if (!entity) {
      throw new NotFoundException(`Звіт з id=${id} не знайдено`);
    }
    return toReport(entity);
  }

  /**
   * Генерує звіт. Idempotent: якщо звіт того самого (calculationId, format, locale)
   * уже існує — перезаписує файл і оновлює запис у БД (нова hash, новий sizeBytes,
   * новий createdAt).
   */
  async generate(dto: GenerateReportDto): Promise<Report> {
    const calc = await this.calcsService.findOne(dto.calculationId);
    const generator = this.generators.get(dto.format);
    if (!generator) {
      throw new NotFoundException(
        `Generator для формату ${dto.format} не знайдено`,
      );
    }
    const locale = dto.locale ?? 'uk';

    const buffer = await generator.generate(calc, locale);
    const filename = `${dto.format}.${generator.fileExtension}`;
    const stored = await this.storage.write(calc.id, filename, buffer);

    const existing = await this.reportsRepo.findOne({
      where: { calculationId: calc.id, format: dto.format, locale },
    });
    let saved: ReportEntity;
    if (existing) {
      existing.filePath = stored.filePath;
      existing.sizeBytes = stored.sizeBytes;
      existing.contentHash = stored.contentHash;
      saved = await this.reportsRepo.save(existing);
      this.logger.log(
        `Перегенеровано звіт ${saved.id} (${dto.format} / ${locale})`,
      );
    } else {
      const entity = this.reportsRepo.create({
        calculationId: calc.id,
        format: dto.format,
        filePath: stored.filePath,
        sizeBytes: stored.sizeBytes,
        contentHash: stored.contentHash,
        locale,
      });
      saved = await this.reportsRepo.save(entity);
      this.logger.log(`Створено звіт ${saved.id} (${dto.format} / ${locale})`);
    }

    return toReport(saved);
  }

  /** Дістати read-stream + метадані для GET /:id/file. */
  async openFile(id: string): Promise<{
    stream: ReadStream;
    contentType: string;
    sizeBytes: number;
    suggestedFilename: string;
  }> {
    const report = await this.findOne(id);
    const generator = this.generators.get(report.format);
    if (!generator) {
      throw new NotFoundException(
        `Generator для формату ${report.format} не знайдено`,
      );
    }
    const stream = await this.storage.openReadStream(report.filePath);
    const suggestedFilename = `pcf-${report.calculationId.slice(0, 8)}-${report.format}.${generator.fileExtension}`;
    return {
      stream,
      contentType: generator.contentType,
      sizeBytes: report.sizeBytes,
      suggestedFilename,
    };
  }
}
