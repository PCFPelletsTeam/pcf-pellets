/**
 * Режим розрахунку PCF.
 *
 * - `ISO_14067` — повний CFP за ISO 14067:2018: Scope 1 + 2 + 3 (cradle-to-gate / cradle-to-grave).
 * - `CBAM` — спрощений варіант для CBAM-звіту (Reg. EU 2023/956): тільки Scope 1 + 2,
 *   embedded emissions готового товару.
 */
export const CalculationMode = {
  ISO_14067: 'ISO_14067',
  CBAM: 'CBAM',
} as const;

export type CalculationMode = (typeof CalculationMode)[keyof typeof CalculationMode];
