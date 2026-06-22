import type { Report } from '@pcf/shared';
import type { ReportEntity } from './entities/report.entity';

export function toReport(entity: ReportEntity): Report {
  return {
    id: entity.id,
    calculationId: entity.calculationId,
    format: entity.format,
    filePath: entity.filePath,
    sizeBytes: entity.sizeBytes,
    contentHash: entity.contentHash,
    createdAt: entity.createdAt.toISOString(),
  };
}
