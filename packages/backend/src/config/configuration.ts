import type { ValidatedEnv } from './env.validation';

/**
 * Структурований config-об'єкт для `ConfigService.get<...>('database.path')`-доступу.
 * Будується з вже валідованого env, тому всі поля гарантовано відповідають типам.
 */
export interface AppConfig {
  port: number;
  frontendOrigin: string;
  database: {
    path: string;
  };
  reportsDir: string;
  logLevel: ValidatedEnv['LOG_LEVEL'];
}

export function buildConfig(env: ValidatedEnv): AppConfig {
  return {
    port: env.PORT,
    frontendOrigin: env.FRONTEND_ORIGIN,
    database: {
      path: env.DATABASE_PATH,
    },
    reportsDir: env.REPORTS_DIR,
    logLevel: env.LOG_LEVEL,
  };
}
