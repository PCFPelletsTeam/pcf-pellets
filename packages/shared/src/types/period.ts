/**
 * Звітний період (квартал / рік / довільний діапазон).
 * Дати у форматі ISO-8601 (`YYYY-MM-DD`).
 */
export interface ReportingPeriod {
  /** Початок діапазону включно, ISO-8601 (`YYYY-MM-DD`). */
  startDate: string;
  /** Кінець діапазону включно, ISO-8601 (`YYYY-MM-DD`). */
  endDate: string;
  /** Опціональна людська назва — "Q1 2026", "Січень 2026" тощо. */
  label?: string;
}
