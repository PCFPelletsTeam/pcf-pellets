import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { dataSourceOptions } from './data-source.options';

/**
 * Standalone DataSource для **TypeORM CLI** (migration:run / generate / revert).
 *
 * Цей файл навмисно експортує **тільки один** DataSource — інакше CLI впаде з
 * "Given data source file must contain only one export of DataSource instance".
 * Опції живуть у `data-source.options.ts`, які повторно використовує і
 * `DatabaseModule` для runtime'у NestJS.
 */
export default new DataSource(dataSourceOptions);
