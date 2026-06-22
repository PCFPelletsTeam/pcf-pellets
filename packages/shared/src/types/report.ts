import type { ReportFormat } from '../enums/report-format';

/**
 * Згенерований звіт (PDF/CSV/JSON) — метадані, файл лежить на disk.
 */
export interface Report {
  /** UUID. */
  id: string;
  /** PCF-розрахунок, з якого згенеровано звіт. */
  calculationId: string;
  /** Формат експорту. */
  format: ReportFormat;
  /** Шлях до файлу на сервері (відносно storage root). */
  filePath: string;
  /** Розмір файлу у байтах. */
  sizeBytes: number;
  /** SHA-256 хеш контенту — для перевірки цілісності. */
  contentHash: string;
  /** ISO timestamp генерації. */
  createdAt: string;
}

/**
 * Параметри запиту на генерацію звіту.
 */
export interface ReportGenerationRequest {
  /** ID PCF-розрахунку. */
  calculationId: string;
  /** Бажаний формат. */
  format: ReportFormat;
  /** Опціонально: мова звіту (дефолт — українська). */
  locale?: 'uk' | 'en';
}
