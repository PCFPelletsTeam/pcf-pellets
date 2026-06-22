/**
 * Категорії матеріалів і енергоносіїв, що використовуються при виробництві
 * залізорудних окатишів. Використовується для класифікації EF та input items.
 */
export const MaterialCategory = {
  /** Залізорудний концентрат (магнетит / гематит) */
  IRON_ORE_CONCENTRATE: 'IRON_ORE_CONCENTRATE',
  /** Бентонітова глина — зв'язуюча добавка */
  BENTONITE: 'BENTONITE',
  /** Вапняк (CaCO₃) — флюс */
  LIMESTONE: 'LIMESTONE',
  /** Доломіт ((Ca,Mg)CO₃) — флюс */
  DOLOMITE: 'DOLOMITE',
  /** Кокс / коксовий дріб'язок (відновник) */
  COKE: 'COKE',
  /** Природний газ (паливо) */
  NATURAL_GAS: 'NATURAL_GAS',
  /** Кам'яне вугілля (паливо) */
  COAL: 'COAL',
  /** Мазут / нафтопродукти */
  HEAVY_FUEL_OIL: 'HEAVY_FUEL_OIL',
  /** Електроенергія */
  ELECTRICITY: 'ELECTRICITY',
  /** Тепло (закуплене) */
  HEAT: 'HEAT',
  /** Інші добавки */
  OTHER_ADDITIVE: 'OTHER_ADDITIVE',
} as const;

export type MaterialCategory = (typeof MaterialCategory)[keyof typeof MaterialCategory];
