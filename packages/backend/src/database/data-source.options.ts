import * as path from 'node:path';
import * as dotenv from 'dotenv';
import type { DataSourceOptions } from 'typeorm';
import { ENTITIES } from './entities';

/**
 * Чисті налаштування DataSource — імпортуються і CLI (`data-source.ts`),
 * і runtime (`database.module.ts`). Без створення `new DataSource(...)` тут,
 * щоб у файлі data-source.ts був **єдиний** export DataSource (вимога CLI).
 */

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const databasePath = process.env.DATABASE_PATH ?? './storage/pcf.sqlite';

export const dataSourceOptions: DataSourceOptions = {
  type: 'better-sqlite3',
  database: path.resolve(process.cwd(), databasePath),
  entities: ENTITIES,
  migrations: [path.join(__dirname, 'migrations', '*.{ts,js}')],
  migrationsTableName: 'typeorm_migrations',
  synchronize: false,
  logging: process.env.TYPEORM_LOGGING === 'true',
};
