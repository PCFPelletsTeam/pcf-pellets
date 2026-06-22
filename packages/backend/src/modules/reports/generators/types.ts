import type { PCFCalculation, ReportFormat } from '@pcf/shared';

export type ReportLocale = 'uk' | 'en';

/**
 * Спільний інтерфейс для всіх генераторів звітів.
 *
 * Generator — це pure transformer: PCFCalculation + locale → Buffer.
 * Він не знає про БД, не пише на диск, не серіалізує метадані.
 * За persistence відповідає ReportStorageService + ReportsService.
 */
export interface ReportGenerator {
  readonly format: ReportFormat;
  readonly contentType: string;
  readonly fileExtension: string;
  generate(calc: PCFCalculation, locale: ReportLocale): Promise<Buffer>;
}
