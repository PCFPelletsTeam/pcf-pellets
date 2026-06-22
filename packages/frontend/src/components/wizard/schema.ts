import { z } from 'zod';
import {
  CalculationMode,
  ElectricitySource,
  MaterialCategory,
  Unit,
} from '@pcf/shared';

// --- Категорії, що показуються на кроці 2 (сировина) ---
export const RAW_MATERIAL_CATEGORIES = [
  MaterialCategory.IRON_ORE_CONCENTRATE,
  MaterialCategory.BENTONITE,
  MaterialCategory.LIMESTONE,
  MaterialCategory.DOLOMITE,
  MaterialCategory.OTHER_ADDITIVE,
] as const;

// --- Категорії, що показуються на кроці 3 (енергія/паливо) ---
export const ENERGY_CATEGORIES = [
  MaterialCategory.NATURAL_GAS,
  MaterialCategory.COAL,
  MaterialCategory.COKE,
  MaterialCategory.HEAVY_FUEL_OIL,
  MaterialCategory.ELECTRICITY,
  MaterialCategory.HEAT,
] as const;

// --- Дефолтна одиниця за категорією (підказка для UX, користувач може змінити) ---
export const DEFAULT_UNIT_BY_CATEGORY: Record<MaterialCategory, Unit> = {
  IRON_ORE_CONCENTRATE: Unit.TONNE,
  BENTONITE: Unit.TONNE,
  LIMESTONE: Unit.TONNE,
  DOLOMITE: Unit.TONNE,
  COKE: Unit.TONNE,
  NATURAL_GAS: Unit.M3,
  COAL: Unit.TONNE,
  HEAVY_FUEL_OIL: Unit.TONNE,
  ELECTRICITY: Unit.KWH,
  HEAT: Unit.GJ,
  OTHER_ADDITIVE: Unit.KG,
};

const POSITIVE_DECIMAL = /^(\d+\.?\d*|\.\d+)$/;

const itemSchema = z
  .object({
    id: z.string().uuid(),
    materialId: z.string().uuid(),
    category: z.nativeEnum(MaterialCategory),
    quantity: z
      .string()
      .min(1, 'Введіть кількість')
      .regex(POSITIVE_DECIMAL, 'Має бути додатнє число'),
    unit: z.nativeEnum(Unit),
    electricitySource: z.nativeEnum(ElectricitySource).optional(),
    notes: z.string().max(500).optional(),
  })
  .refine(
    (item) => item.category !== MaterialCategory.ELECTRICITY || !!item.electricitySource,
    {
      message: 'Для електроенергії оберіть джерело (UA grid / nuclear PPA / coal)',
      path: ['electricitySource'],
    },
  );

export const wizardSchema = z
  .object({
    facilityName: z
      .string()
      .min(2, 'Мінімум 2 символи')
      .max(200, 'Максимум 200 символів'),
    mode: z.nativeEnum(CalculationMode),
    period: z.object({
      startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Формат YYYY-MM-DD'),
      endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Формат YYYY-MM-DD'),
      label: z.string().max(100).optional().or(z.literal('')),
    }),
    notes: z.string().max(2000).optional().or(z.literal('')),
    items: z.array(itemSchema).min(1, 'Додайте хоча б один матеріал або енергоносій'),
    process: z.object({
      outputMass: z
        .string()
        .min(1, 'Введіть масу продукту')
        .regex(POSITIVE_DECIMAL, 'Має бути додатнє число'),
      outputMassUnit: z.nativeEnum(Unit),
      technologicalLossesPercent: z
        .string()
        .regex(POSITIVE_DECIMAL, 'Має бути додатнє число')
        .optional()
        .or(z.literal('')),
      productionLineName: z.string().max(200).optional().or(z.literal('')),
    }),
  })
  .refine((data) => data.period.endDate >= data.period.startDate, {
    message: 'Дата кінця періоду має бути ≥ дати початку',
    path: ['period', 'endDate'],
  });

export type WizardFormData = z.infer<typeof wizardSchema>;
export type WizardItem = WizardFormData['items'][number];

// --- Поля, що валідуються при переході "Далі" з кожного кроку ---
export const STEP_FIELDS: Record<number, (keyof WizardFormData | string)[]> = {
  1: ['facilityName', 'mode', 'period.startDate', 'period.endDate', 'period.label', 'notes'],
  2: [], // не валідуємо items на step 2 → 3 (можуть бути додані на step 3)
  3: ['items'], // валідуємо items на step 3 → 4 (тут має бути ≥1)
  4: ['process.outputMass', 'process.outputMassUnit', 'process.technologicalLossesPercent', 'process.productionLineName'],
  5: [],
  6: [],
};

export const STEPS = [
  { n: 1, title: 'Період', short: 'Період' },
  { n: 2, title: 'Сировина', short: 'Сировина' },
  { n: 3, title: 'Енергія', short: 'Енергія' },
  { n: 4, title: 'Параметри процесу', short: 'Процес' },
  { n: 5, title: 'Результати', short: 'Результати' },
  { n: 6, title: 'Звіти', short: 'Звіти' },
] as const;

export const TOTAL_STEPS = STEPS.length;

/** Дефолтні значення форми — поточний квартал, ПГЗК. */
export function buildDefaults(): WizardFormData {
  const now = new Date();
  const quarter = Math.floor(now.getMonth() / 3); // 0..3
  const year = now.getFullYear();
  const startMonth = quarter * 3;
  const start = new Date(Date.UTC(year, startMonth, 1));
  const end = new Date(Date.UTC(year, startMonth + 3, 0));
  const iso = (d: Date) => d.toISOString().slice(0, 10);

  return {
    facilityName: 'Полтавський ГЗК, фабрика окатишів №2',
    mode: CalculationMode.ISO_14067,
    period: {
      startDate: iso(start),
      endDate: iso(end),
      label: `Q${quarter + 1} ${year}`,
    },
    notes: '',
    items: [],
    process: {
      outputMass: '',
      outputMassUnit: Unit.TONNE,
      technologicalLossesPercent: '',
      productionLineName: '',
    },
  };
}
