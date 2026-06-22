/**
 * Джерело електроенергії — впливає на EF Scope 2.
 * Значення EF (kg CO₂e/kWh) задаються у JSON-базі emission-factors:
 *
 * - `UA_GRID_AVG` ≈ 0.35  — усереднений mix енергосистеми України
 * - `UA_NUCLEAR_PPA` ≈ 0.012 — пряма закупівля АЕС за PPA (low-carbon)
 * - `UA_COAL` ≈ 1.00 — генерація з кам'яного вугілля (worst case)
 */
export const ElectricitySource = {
  UA_GRID_AVG: 'UA_GRID_AVG',
  UA_NUCLEAR_PPA: 'UA_NUCLEAR_PPA',
  UA_COAL: 'UA_COAL',
} as const;

export type ElectricitySource = (typeof ElectricitySource)[keyof typeof ElectricitySource];
