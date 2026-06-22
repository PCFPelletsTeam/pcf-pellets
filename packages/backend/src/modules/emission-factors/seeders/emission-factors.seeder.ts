import {
  Injectable,
  Logger,
  type OnApplicationBootstrap,
} from '@nestjs/common';
import type {
  DecimalString,
  ElectricitySource,
  GhgScope,
  MaterialCategory,
  Unit,
} from '@pcf/shared';
import type { EmissionFactorEntity } from '../entities/emission-factor.entity';
import { EmissionFactorsService } from '../emission-factors.service';
import seedFile from '../data/emission-factors.seed.json';

interface SeedItem {
  key: string;
  name: string;
  category: MaterialCategory;
  value: string;
  unit: Unit;
  scope: GhgScope;
  electricitySource?: ElectricitySource;
  source: string;
  sourceUrl?: string;
  year: number;
  validFrom?: string;
  validUntil?: string;
  region: string;
  uncertaintyPercent?: string;
  notes?: string;
}

interface SeedFile {
  version: string;
  notes: string;
  items: SeedItem[];
}

/**
 * Завантажує EF з `data/emission-factors.seed.json` при першому старті.
 *
 * Idempotent: якщо `emission_factors` уже не порожня — нічого не робить.
 *
 * Чому **JSON-файл, а не міграція**:
 *   - EF — це reference data, не структура схеми; може оновлюватись без міграції БД
 *   - кожна нова версія datasetа — bump поля `version` у JSON та повторний запуск
 *     (поки що ручний; пізніше можна додати "force re-seed" через CLI команду)
 */
@Injectable()
export class EmissionFactorsSeeder implements OnApplicationBootstrap {
  private readonly logger = new Logger(EmissionFactorsSeeder.name);

  constructor(private readonly efService: EmissionFactorsService) {}

  async onApplicationBootstrap(): Promise<void> {
    const existing = await this.efService.count();
    if (existing > 0) {
      this.logger.log(
        `emission_factors: ${existing} запис(ів) — seed пропускаю`,
      );
      return;
    }

    const file = seedFile as unknown as SeedFile;
    this.logger.log(
      `emission_factors: таблиця порожня — заповнюю з seed v${file.version} (${file.items.length} EF)`,
    );

    const entities: Partial<EmissionFactorEntity>[] = file.items.map(
      (item) => ({
        key: item.key,
        name: item.name,
        category: item.category,
        value: item.value as DecimalString,
        unit: item.unit,
        scope: item.scope,
        electricitySource: item.electricitySource ?? null,
        source: item.source,
        sourceUrl: item.sourceUrl ?? null,
        year: item.year,
        validFrom: item.validFrom ?? null,
        validUntil: item.validUntil ?? null,
        region: item.region,
        uncertaintyPercent:
          (item.uncertaintyPercent as DecimalString | undefined) ?? null,
        notes: item.notes ?? null,
      }),
    );

    await this.efService.bulkInsert(entities);
    this.logger.log(`emission_factors: seed завершено (${entities.length} EF)`);
  }
}
