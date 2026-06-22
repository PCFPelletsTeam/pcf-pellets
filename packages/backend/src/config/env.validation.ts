/**
 * Валідація environment variables — викликається ConfigModule на старті.
 * Без зайвих залежностей: чиста TS-функція, що кидає `Error` при невалідному env.
 */
export interface ValidatedEnv {
  PORT: number;
  FRONTEND_ORIGIN: string;
  DATABASE_PATH: string;
  REPORTS_DIR: string;
  LOG_LEVEL: 'error' | 'warn' | 'log' | 'debug' | 'verbose';
}

const ALLOWED_LOG_LEVELS: ValidatedEnv['LOG_LEVEL'][] = [
  'error',
  'warn',
  'log',
  'debug',
  'verbose',
];

/**
 * Безпечне приведення `unknown` env-значення до string.
 * Якщо значення не string і не number — використовуємо fallback (щоб уникнути
 * `[object Object]` від `String(...)` на arbitrary об'єктах, що тригерить
 * `@typescript-eslint/no-base-to-string`).
 */
function asString(value: unknown, fallback: string): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value))
    return value.toString();
  return fallback;
}

export function validateEnv(rawEnv: Record<string, unknown>): ValidatedEnv {
  const issues: string[] = [];

  const portRaw = rawEnv.PORT;
  const port =
    typeof portRaw === 'number' ? portRaw : Number(asString(portRaw, '3000'));
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    issues.push(
      `PORT must be integer 1..65535, got "${asString(portRaw, '<missing>')}"`,
    );
  }

  const frontendOrigin = asString(
    rawEnv.FRONTEND_ORIGIN,
    'http://localhost:5173',
  );
  if (!/^https?:\/\//.test(frontendOrigin)) {
    issues.push(
      `FRONTEND_ORIGIN must start with http(s)://, got "${frontendOrigin}"`,
    );
  }

  const databasePath = asString(rawEnv.DATABASE_PATH, './storage/pcf.sqlite');
  if (!databasePath.trim()) {
    issues.push('DATABASE_PATH must be non-empty');
  }

  const reportsDir = asString(rawEnv.REPORTS_DIR, './storage/reports');
  if (!reportsDir.trim()) {
    issues.push('REPORTS_DIR must be non-empty');
  }

  const logLevel = asString(
    rawEnv.LOG_LEVEL,
    'log',
  ) as ValidatedEnv['LOG_LEVEL'];
  if (!ALLOWED_LOG_LEVELS.includes(logLevel)) {
    issues.push(
      `LOG_LEVEL must be one of ${ALLOWED_LOG_LEVELS.join('|')}, got "${logLevel}"`,
    );
  }

  if (issues.length > 0) {
    throw new Error(
      `Environment validation failed:\n  - ${issues.join('\n  - ')}`,
    );
  }

  return {
    PORT: port,
    FRONTEND_ORIGIN: frontendOrigin,
    DATABASE_PATH: databasePath,
    REPORTS_DIR: reportsDir,
    LOG_LEVEL: logLevel,
  };
}
