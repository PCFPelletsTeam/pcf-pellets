/**
 * Одиниці виміру для масових / енергетичних / об'ємних інпутів.
 * EF задаються у відповідних знаменниках — наприклад:
 *  - kg CO₂e / kg для матеріалів,
 *  - kg CO₂e / kWh для електроенергії,
 *  - kg CO₂e / m³ для природного газу (або /MJ).
 */
export const Unit = {
  KG: 'kg',
  TONNE: 't',
  KWH: 'kWh',
  MWH: 'MWh',
  MJ: 'MJ',
  GJ: 'GJ',
  M3: 'm3',
  LITRE: 'L',
} as const;

export type Unit = (typeof Unit)[keyof typeof Unit];
