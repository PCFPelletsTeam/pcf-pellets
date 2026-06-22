/**
 * Формати експорту звіту:
 * - `PDF_ISO_14067` — повний PCF-звіт за ISO 14067 (PDF).
 * - `CSV_CBAM` — CSV для CBAM Quarterly Report.
 * - `JSON_CX_0029` — JSON у форматі Catena-X CX-0029 (PCF data exchange).
 */
export const ReportFormat = {
  PDF_ISO_14067: 'PDF_ISO_14067',
  CSV_CBAM: 'CSV_CBAM',
  JSON_CX_0029: 'JSON_CX_0029',
} as const;

export type ReportFormat = (typeof ReportFormat)[keyof typeof ReportFormat];
