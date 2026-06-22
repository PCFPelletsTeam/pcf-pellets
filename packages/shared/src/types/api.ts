/**
 * Стандартизована форма помилки API (alignment з NestJS HttpException).
 */
export interface ApiError {
  statusCode: number;
  /** Машинний код для frontend ("VALIDATION_FAILED", "EF_NOT_FOUND", "UNIT_MISMATCH"). */
  errorCode?: string;
  /** Людське повідомлення українською (для відображення користувачу). */
  message: string;
  /** Розширені деталі — наприклад масив validation issues. */
  details?: unknown;
  /** ISO timestamp. */
  timestamp: string;
  /** Шлях запиту, на якому стався збій. */
  path: string;
}

/**
 * Універсальна обгортка для пагінованих списків (materials / EF / calculations).
 */
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}
