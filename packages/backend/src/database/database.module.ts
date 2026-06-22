import * as path from 'node:path';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ENTITIES } from './entities';

/**
 * Глобальний модуль persistence-шару.
 *
 * Підключає `TypeOrmModule.forRootAsync` з ConfigService — шлях до SQLite
 * читається з `database.path` (config побудований у `app.module.ts` через
 * `validateEnv`).
 *
 * Міграції **не запускаються автоматично** (`migrationsRun: false`) —
 * для dev/prod явно `npm run migration:run`. Це знижує ризик прихованих
 * змін схеми при деплої.
 */
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const databasePath = config.getOrThrow<string>('database.path');
        return {
          type: 'better-sqlite3',
          database: path.resolve(process.cwd(), databasePath),
          entities: ENTITIES,
          migrations: [path.join(__dirname, 'migrations', '*.{ts,js}')],
          migrationsTableName: 'typeorm_migrations',
          migrationsRun: false,
          synchronize: false,
          autoLoadEntities: false,
          logging: process.env.TYPEORM_LOGGING === 'true',
        };
      },
    }),
  ],
})
export class DatabaseModule {}
