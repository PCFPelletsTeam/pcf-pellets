import {
  type MigrationInterface,
  type QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

/**
 * Початкова схема БД для PCF-калькулятора.
 *
 * 5 таблиць:
 *   - `materials`             — довідник матеріалів і енергоносіїв
 *   - `emission_factors`      — база EF (категорія / value / scope / source / year)
 *   - `pcf_calculations`      — PCF-розрахунки (один рядок = один звіт)
 *   - `calculation_lines`     — деталізовані рядки розрахунку з EF snapshot'ом (audit trail)
 *   - `reports`               — згенеровані PDF/CSV/JSON, метадані файлів
 *
 * Дизайн-рішення:
 *   - Усі decimal-значення зберігаються як TEXT (SQLite не має decimal-типу,
 *     `Number` втрачає точність).
 *   - `calculation_lines.emission_factor_snapshot_json` — повна frozen-копія EF,
 *     **не FK** на `emission_factors.id` (вимога audit trail ISO 14067 / CBAM:
 *     історичний звіт має давати ті самі цифри після оновлення EF DB).
 *   - `created_at` / `updated_at` мають default `CURRENT_TIMESTAMP`.
 */
export class InitialSchema1762470000000 implements MigrationInterface {
  name = 'InitialSchema1762470000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // -------------------- materials --------------------
    await queryRunner.createTable(
      new Table({
        name: 'materials',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            isNullable: false,
          },
          { name: 'name', type: 'varchar', length: '200', isNullable: false },
          {
            name: 'category',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'default_unit',
            type: 'varchar',
            length: '10',
            isNullable: false,
          },
          { name: 'description', type: 'text', isNullable: true },
          {
            name: 'created_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );
    await queryRunner.createIndex(
      'materials',
      new TableIndex({
        name: 'idx_materials_category',
        columnNames: ['category'],
      }),
    );

    // -------------------- emission_factors --------------------
    await queryRunner.createTable(
      new Table({
        name: 'emission_factors',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            isNullable: false,
          },
          { name: 'key', type: 'varchar', length: '100', isNullable: false },
          { name: 'name', type: 'varchar', length: '200', isNullable: false },
          {
            name: 'category',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          { name: 'value', type: 'text', isNullable: false },
          { name: 'unit', type: 'varchar', length: '10', isNullable: false },
          { name: 'scope', type: 'varchar', length: '20', isNullable: false },
          {
            name: 'electricity_source',
            type: 'varchar',
            length: '30',
            isNullable: true,
          },
          { name: 'source', type: 'varchar', length: '200', isNullable: false },
          {
            name: 'source_url',
            type: 'varchar',
            length: '500',
            isNullable: true,
          },
          { name: 'year', type: 'integer', isNullable: false },
          {
            name: 'valid_from',
            type: 'varchar',
            length: '10',
            isNullable: true,
          },
          {
            name: 'valid_until',
            type: 'varchar',
            length: '10',
            isNullable: true,
          },
          { name: 'region', type: 'varchar', length: '10', isNullable: false },
          { name: 'uncertainty_percent', type: 'text', isNullable: true },
          { name: 'notes', type: 'text', isNullable: true },
          {
            name: 'created_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );
    await queryRunner.createIndex(
      'emission_factors',
      new TableIndex({
        name: 'uq_emission_factors_key',
        columnNames: ['key'],
        isUnique: true,
      }),
    );
    await queryRunner.createIndex(
      'emission_factors',
      new TableIndex({
        name: 'idx_emission_factors_category',
        columnNames: ['category'],
      }),
    );
    await queryRunner.createIndex(
      'emission_factors',
      new TableIndex({
        name: 'idx_emission_factors_year',
        columnNames: ['year'],
      }),
    );

    // -------------------- pcf_calculations --------------------
    await queryRunner.createTable(
      new Table({
        name: 'pcf_calculations',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            isNullable: false,
          },
          { name: 'mode', type: 'varchar', length: '20', isNullable: false },
          {
            name: 'facility_name',
            type: 'varchar',
            length: '200',
            isNullable: false,
          },
          {
            name: 'period_start',
            type: 'varchar',
            length: '10',
            isNullable: false,
          },
          {
            name: 'period_end',
            type: 'varchar',
            length: '10',
            isNullable: false,
          },
          {
            name: 'period_label',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          { name: 'input_items_json', type: 'text', isNullable: false },
          { name: 'process_parameters_json', type: 'text', isNullable: false },
          { name: 'breakdown_scope1_kg_co2e', type: 'text', isNullable: false },
          { name: 'breakdown_scope2_kg_co2e', type: 'text', isNullable: false },
          { name: 'breakdown_scope3_kg_co2e', type: 'text', isNullable: false },
          { name: 'breakdown_total_kg_co2e', type: 'text', isNullable: false },
          {
            name: 'pcf_kg_co2e_per_kg_pellets',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'methodology_version',
            type: 'varchar',
            length: '20',
            isNullable: false,
          },
          { name: 'notes', type: 'text', isNullable: true },
          {
            name: 'created_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );
    await queryRunner.createIndex(
      'pcf_calculations',
      new TableIndex({
        name: 'idx_pcf_calculations_mode',
        columnNames: ['mode'],
      }),
    );
    await queryRunner.createIndex(
      'pcf_calculations',
      new TableIndex({
        name: 'idx_pcf_calculations_period',
        columnNames: ['period_start', 'period_end'],
      }),
    );
    await queryRunner.createIndex(
      'pcf_calculations',
      new TableIndex({
        name: 'idx_pcf_calculations_facility',
        columnNames: ['facility_name'],
      }),
    );

    // -------------------- calculation_lines --------------------
    await queryRunner.createTable(
      new Table({
        name: 'calculation_lines',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            isNullable: false,
          },
          {
            name: 'calculation_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          {
            name: 'input_item_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          { name: 'scope', type: 'varchar', length: '20', isNullable: false },
          { name: 'emissions_kg_co2e', type: 'text', isNullable: false },
          {
            name: 'emission_factor_snapshot_json',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );
    await queryRunner.createForeignKey(
      'calculation_lines',
      new TableForeignKey({
        name: 'fk_calculation_lines_calculation',
        columnNames: ['calculation_id'],
        referencedTableName: 'pcf_calculations',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
    await queryRunner.createIndex(
      'calculation_lines',
      new TableIndex({
        name: 'idx_calculation_lines_calculation',
        columnNames: ['calculation_id'],
      }),
    );
    await queryRunner.createIndex(
      'calculation_lines',
      new TableIndex({
        name: 'idx_calculation_lines_scope',
        columnNames: ['scope'],
      }),
    );

    // -------------------- reports --------------------
    await queryRunner.createTable(
      new Table({
        name: 'reports',
        columns: [
          {
            name: 'id',
            type: 'varchar',
            length: '36',
            isPrimary: true,
            isNullable: false,
          },
          {
            name: 'calculation_id',
            type: 'varchar',
            length: '36',
            isNullable: false,
          },
          { name: 'format', type: 'varchar', length: '30', isNullable: false },
          {
            name: 'file_path',
            type: 'varchar',
            length: '500',
            isNullable: false,
          },
          { name: 'size_bytes', type: 'integer', isNullable: false },
          {
            name: 'content_hash',
            type: 'varchar',
            length: '64',
            isNullable: false,
          },
          { name: 'locale', type: 'varchar', length: '5', isNullable: true },
          {
            name: 'created_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );
    await queryRunner.createForeignKey(
      'reports',
      new TableForeignKey({
        name: 'fk_reports_calculation',
        columnNames: ['calculation_id'],
        referencedTableName: 'pcf_calculations',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
    await queryRunner.createIndex(
      'reports',
      new TableIndex({
        name: 'idx_reports_calculation',
        columnNames: ['calculation_id'],
      }),
    );
    await queryRunner.createIndex(
      'reports',
      new TableIndex({ name: 'idx_reports_format', columnNames: ['format'] }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop у зворотному порядку щодо FK.
    await queryRunner.dropTable('reports', true);
    await queryRunner.dropTable('calculation_lines', true);
    await queryRunner.dropTable('pcf_calculations', true);
    await queryRunner.dropTable('emission_factors', true);
    await queryRunner.dropTable('materials', true);
  }
}
