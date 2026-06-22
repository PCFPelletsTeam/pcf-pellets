import type { CalculationMode } from '../enums/calculation-mode';
import type { ElectricitySource } from '../enums/energy-source';
import type { GhgScope } from '../enums/ghg-scope';
import type { MaterialCategory } from '../enums/material-category';
import type { Unit } from '../enums/unit';
import type { DecimalString } from './decimal-string';
import type { EmissionFactorSnapshot } from './emission-factor';
import type { ReportingPeriod } from './period';

/**
 * Один input-рядок: матеріал/енергоносій + кількість + одиниця.
 * Збирається у wizard'і на кроках Raw Materials / Energy / Process.
 */
export interface CalculationInputItem {
  /** UUID рядка (генерується на frontend для контролю порядку). */
  id: string;
  /** ID запису з довідника `materials` (master data). */
  materialId: string;
  /** Дублюємо категорію для зручності серіалізації / відображення. */
  category: MaterialCategory;
  /** Кількість (string для точності). */
  quantity: DecimalString;
  /** Одиниця кількості. Має бути сумісною із EF.unit (інакше backend дає помилку). */
  unit: Unit;
  /**
   * Тільки для `category = ELECTRICITY` — обране джерело електроенергії
   * (визначає, який EF буде застосовано: grid_avg / nuclear_PPA / coal).
   */
  electricitySource?: ElectricitySource;
  /** Опціональний коментар інженера. */
  notes?: string;
}

/**
 * Розклад внеску одного input item у фінальний PCF.
 * Зберігається у результаті розрахунку для audit trail.
 */
export interface CalculationLineResult {
  /** Посилання на input item, до якого відноситься цей рядок. */
  inputItemId: string;
  /** Snapshot використаного EF (immutable копія). */
  emissionFactor: EmissionFactorSnapshot;
  /** До якого Scope зараховано цей рядок. */
  scope: GhgScope;
  /** Викиди по цьому рядку, kg CO₂e (string для точності). */
  emissionsKgCo2e: DecimalString;
}

/**
 * Розклад викидів за GHG Scope.
 */
export interface ScopeBreakdown {
  /** Викиди Scope 1, kg CO₂e. */
  scope1KgCo2e: DecimalString;
  /** Викиди Scope 2, kg CO₂e. */
  scope2KgCo2e: DecimalString;
  /**
   * Викиди Scope 3, kg CO₂e.
   * У режимі `CBAM` це поле = `"0"` (Scope 3 не враховується).
   */
  scope3KgCo2e: DecimalString;
  /** Сума Scope 1 + 2 + 3. */
  totalKgCo2e: DecimalString;
}

/**
 * Технологічні параметри процесу — обсяг продукції, втрати тощо.
 * Виносимо окремо, бо це не "матеріал" у сенсі EF, але впливає на знаменник
 * (PCF = total emissions / mass of pellets).
 */
export interface ProcessParameters {
  /** Маса виробленого продукту (окатишів) за звітний період. */
  outputMass: DecimalString;
  /** Одиниця маси продукту (кг або тонни). */
  outputMassUnit: Unit;
  /** Технологічні втрати у відсотках (опціонально, для анотації). */
  technologicalLossesPercent?: DecimalString;
  /** Опціональна назва конкретної установки / лінії випалу. */
  productionLineName?: string;
}

/**
 * Інпут (форма) для нового PCF-розрахунку.
 * Frontend збирає це у wizard'і й POST'ить на `/calculations`.
 */
export interface PCFCalculationInput {
  /** Звітний період. */
  period: ReportingPeriod;
  /** Режим розрахунку — впливає на те, чи враховується Scope 3. */
  mode: CalculationMode;
  /** Назва підприємства / установки (для звіту). */
  facilityName: string;
  /** Усі input items (raw materials + energy). */
  items: CalculationInputItem[];
  /** Параметри процесу і знаменник для PCF. */
  process: ProcessParameters;
  /** Загальні нотатки / коментарі еколога до розрахунку. */
  notes?: string;
}

/**
 * Готовий результат розрахунку — те, що зберігається у БД як
 * один запис `pcf_calculations` і повертається з API.
 */
export interface PCFCalculation {
  /** UUID. */
  id: string;
  /** Усі вхідні дані (повертаються разом з результатом для візуалізації). */
  input: PCFCalculationInput;
  /**
   * Підсумковий PCF: kg CO₂e на 1 кг продукту.
   * Розраховується як `breakdown.totalKgCo2e / outputMassInKg`.
   */
  pcfKgCo2ePerKgPellets: DecimalString;
  /** Розклад за Scope 1 / 2 / 3. */
  breakdown: ScopeBreakdown;
  /** Детальний розклад по кожному input-рядку (audit trail). */
  lines: CalculationLineResult[];
  /**
   * Версія методології калькулятора (semver).
   * Інкрементується при змінах у формулах — для відтворюваності.
   */
  methodologyVersion: string;
  /** ISO timestamp створення. */
  createdAt: string;
  /** ISO timestamp останньої правки (input-only; перерахунок створює новий запис). */
  updatedAt: string;
}
