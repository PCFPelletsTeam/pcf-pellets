// --- Enums (runtime values) ---
// Явний named reexport — щоб esbuild при pre-bundle через CJS interop
// не губив named exports (як губив ReportFormat у Vite через ланцюг `export *`).
export { CalculationMode } from './enums/calculation-mode';
export { GhgScope } from './enums/ghg-scope';
export { MaterialCategory } from './enums/material-category';
export { ElectricitySource } from './enums/energy-source';
export { Unit } from './enums/unit';
export { ReportFormat } from './enums/report-format';

// --- Decimal helpers (runtime functions) ---
export { toDecimalString, isDecimalString } from './types/decimal-string';

// --- Type-only reexports ---
export type { DecimalString } from './types/decimal-string';
export type { ReportingPeriod } from './types/period';
export type { Material } from './types/material';
export type {
  EmissionFactor,
  EmissionFactorSnapshot,
} from './types/emission-factor';
export type {
  CalculationInputItem,
  CalculationLineResult,
  ScopeBreakdown,
  ProcessParameters,
  PCFCalculationInput,
  PCFCalculation,
} from './types/pcf-calculation';
export type { Report, ReportGenerationRequest } from './types/report';
export type { ApiError, Paginated } from './types/api';
