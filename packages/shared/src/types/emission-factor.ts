import type { ElectricitySource } from '../enums/energy-source';
import type { GhgScope } from '../enums/ghg-scope';
import type { MaterialCategory } from '../enums/material-category';
import type { Unit } from '../enums/unit';
import type { DecimalString } from './decimal-string';

/**
 * Emission Factor — коефіцієнт викидів CO₂e на одиницю кількості.
 *
 * Завантажуються з JSON (`packages/backend/src/modules/emission-factors/data/`)
 * і зберігаються в БД при старті backend. Значення `value` тримається як string
 * для збереження точності.
 */
export interface EmissionFactor {
  /** UUID. */
  id: string;
  /** Стабільний бізнес-ключ — "ELECTRICITY_UA_GRID_AVG", "NG_COMBUSTION", "BENTONITE_PRODUCTION". */
  key: string;
  /** Людська назва ("Електроенергія, mix UA", "Природний газ — спалювання"). */
  name: string;
  /** Категорія матеріалу, до якої застосовний EF. */
  category: MaterialCategory;
  /**
   * Числове значення EF (kg CO₂e на одиницю), як string для точності.
   * Наприклад, для UA grid: `"0.35"`, для NG combustion: `"2.02"`.
   */
  value: DecimalString;
  /** Знаменник — одиниця, на яку розрахований EF (`/kg`, `/kWh`, `/m3`...). */
  unit: Unit;
  /** До якого Scope (1/2/3) відноситься EF при дефолтному застосуванні. */
  scope: GhgScope;
  /**
   * Тільки для електроенергії — конкретний UA-варіант.
   * Дозволяє фронту запропонувати правильний EF при виборі джерела.
   */
  electricitySource?: ElectricitySource;
  /** Джерело даних — "DEFRA 2024", "IPCC AR6", "Operator measured", "EU CBAM Default". */
  source: string;
  /** URL/посилання на джерело (опціонально). */
  sourceUrl?: string;
  /** Рік, до якого відноситься EF (наприклад `2024`). */
  year: number;
  /**
   * Період валідності EF (опціонально).
   * Якщо null — EF вважається актуальним до моменту перепризначення.
   */
  validFrom?: string;
  validUntil?: string;
  /** Регіон / країна застосовності, ISO-3166 alpha-2 ("UA", "EU", "GLOBAL"). */
  region: string;
  /**
   * Невизначеність (uncertainty) у відсотках, як string. Опціонально.
   * Для повноти ISO 14067 рекомендовано вказувати U±%.
   */
  uncertaintyPercent?: DecimalString;
  /** Нотатки еколога / методологічні зауваги. */
  notes?: string;
  /** ISO timestamps. */
  createdAt: string;
  updatedAt: string;
}

/**
 * Незмінний "snapshot" EF, що зберігається разом із PCFCalculation.
 *
 * Це **не reference** на запис у таблиці `emission_factors`, а повна копія
 * значень на момент розрахунку — необхідна для audit trail / відтворюваності
 * (вимога ISO 14067 і CBAM): історичний звіт має дати ті самі цифри навіть
 * після оновлення EF DB.
 */
export type EmissionFactorSnapshot = Omit<EmissionFactor, 'createdAt' | 'updatedAt'> & {
  /** ID оригінального запису в EF DB (для трасування, не для перерахунку). */
  originalEmissionFactorId: string;
  /** Момент, коли був зроблений snapshot. */
  capturedAt: string;
};
