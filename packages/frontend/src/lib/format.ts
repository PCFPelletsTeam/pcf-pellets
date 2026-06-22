import { Decimal } from 'decimal.js';
import type {
  CalculationMode,
  ElectricitySource,
  GhgScope,
  MaterialCategory,
  Unit,
} from '@pcf/shared';

/**
 * Форматує decimal-string як число з пробілами-розділювачами тисяч,
 * для відображення в українському локалі. Зберігає точність — не перетворює
 * у Number.
 *
 * Приклад: `"24600000"` → `"24 600 000"`, `"0.246"` → `"0.246"`, `"1234.56789"` → `"1 234.567 89"`.
 */
export function formatDecimal(value: string, opts: { maxDecimals?: number } = {}): string {
  const d = new Decimal(value);
  const fixed = opts.maxDecimals !== undefined ? d.toFixed(opts.maxDecimals) : d.toFixed();
  const [intPart, fracPart] = fixed.split('.');
  const grouped = (intPart ?? '0').replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return fracPart ? `${grouped}.${fracPart}` : grouped;
}

/** Скорочений запис: 24600000 → "24.6 млн", 7500 → "7.5 тис". Для дашборду. */
export function formatCompact(value: string): string {
  const n = new Decimal(value);
  if (n.abs().gte(1_000_000_000)) return `${n.div(1_000_000_000).toFixed(2)} млрд`;
  if (n.abs().gte(1_000_000)) return `${n.div(1_000_000).toFixed(2)} млн`;
  if (n.abs().gte(1_000)) return `${n.div(1_000).toFixed(1)} тис`;
  return n.toFixed();
}

/** ISO datetime → "07.05.2026, 14:00". */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('uk-UA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** ISO date → "07.05.2026". */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('uk-UA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

// --- Українські лейбли для enum-значень ---

export const CATEGORY_LABEL: Record<MaterialCategory, string> = {
  IRON_ORE_CONCENTRATE: 'Залізорудний концентрат',
  BENTONITE: 'Бентоніт',
  LIMESTONE: 'Вапняк',
  DOLOMITE: 'Доломіт',
  COKE: 'Кокс',
  NATURAL_GAS: 'Природний газ',
  COAL: "Кам'яне вугілля",
  HEAVY_FUEL_OIL: 'Мазут',
  ELECTRICITY: 'Електроенергія',
  HEAT: 'Тепло',
  OTHER_ADDITIVE: 'Інша добавка',
};

export const ELECTRICITY_SOURCE_LABEL: Record<ElectricitySource, string> = {
  UA_GRID_AVG: 'UA mix (усереднений)',
  UA_NUCLEAR_PPA: 'АЕС (PPA)',
  UA_COAL: 'Вугільна генерація',
};

export const SCOPE_LABEL: Record<GhgScope, string> = {
  SCOPE_1: 'Scope 1 (прямі)',
  SCOPE_2: 'Scope 2 (енергетичні)',
  SCOPE_3: 'Scope 3 (інші непрямі)',
};

export const SCOPE_COLOR: Record<GhgScope, string> = {
  SCOPE_1: 'bg-orange-500',
  SCOPE_2: 'bg-blue-500',
  SCOPE_3: 'bg-purple-500',
};

export const MODE_LABEL: Record<CalculationMode, string> = {
  ISO_14067: 'ISO 14067 (повний CFP)',
  CBAM: 'CBAM (Scope 1+2)',
};

export const UNIT_LABEL: Record<Unit, string> = {
  kg: 'кг',
  t: 'т',
  kWh: 'кВт·год',
  MWh: 'МВт·год',
  MJ: 'МДж',
  GJ: 'ГДж',
  m3: 'м³',
  L: 'л',
};
