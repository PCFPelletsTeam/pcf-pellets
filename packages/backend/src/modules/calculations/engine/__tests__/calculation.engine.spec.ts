import { Decimal } from 'decimal.js';
import {
  CalculationMode,
  type DecimalString,
  ElectricitySource,
  GhgScope,
  MaterialCategory,
  type PCFCalculationInput,
  Unit,
} from '@pcf/shared';
import { EmissionFactorEntity } from '../../../emission-factors/entities/emission-factor.entity';
import { CalculationEngine } from '../calculation.engine';
import { UnitConversionService } from '../units.service';

/**
 * Хелпер: створює EmissionFactorEntity-схожий об'єкт для фікстур.
 * Заповнює мінімум полів, потрібних engine'у та snapshot mapper'у.
 */
function ef(overrides: {
  id?: string;
  key: string;
  category: MaterialCategory;
  value: string;
  unit: Unit;
  scope: GhgScope;
  electricitySource?: ElectricitySource;
}): EmissionFactorEntity {
  const e = new EmissionFactorEntity();
  e.id = overrides.id ?? `ef-${overrides.key}`;
  e.key = overrides.key;
  e.name = overrides.key;
  e.category = overrides.category;
  e.value = overrides.value as DecimalString;
  e.unit = overrides.unit;
  e.scope = overrides.scope;
  e.electricitySource = overrides.electricitySource ?? null;
  e.source = 'test fixture';
  e.sourceUrl = null;
  e.year = 2024;
  e.validFrom = null;
  e.validUntil = null;
  e.region = 'GLOBAL';
  e.uncertaintyPercent = null;
  e.notes = null;
  e.createdAt = new Date('2026-01-01T00:00:00Z');
  e.updatedAt = new Date('2026-01-01T00:00:00Z');
  return e;
}

const STANDARD_INPUT: PCFCalculationInput = {
  period: { startDate: '2026-01-01', endDate: '2026-03-31', label: 'Q1 2026' },
  mode: CalculationMode.ISO_14067,
  facilityName: 'Полтавський ГЗК, фабрика окатишів №2',
  items: [
    {
      id: '11111111-1111-1111-1111-111111111111',
      materialId: 'mat-concentrate',
      category: MaterialCategory.IRON_ORE_CONCENTRATE,
      quantity: '100000' as DecimalString,
      unit: Unit.TONNE, // 100,000 t = 100,000,000 kg
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      materialId: 'mat-ng',
      category: MaterialCategory.NATURAL_GAS,
      quantity: '5000000' as DecimalString,
      unit: Unit.M3,
    },
    {
      id: '33333333-3333-3333-3333-333333333333',
      materialId: 'mat-elec',
      category: MaterialCategory.ELECTRICITY,
      quantity: '20000000' as DecimalString,
      unit: Unit.KWH,
      electricitySource: ElectricitySource.UA_GRID_AVG,
    },
  ],
  process: {
    outputMass: '100000' as DecimalString,
    outputMassUnit: Unit.TONNE, // 100,000 t = 100,000,000 kg
  },
};

const STANDARD_EFS = new Map<string, EmissionFactorEntity>([
  [
    '11111111-1111-1111-1111-111111111111',
    ef({
      key: 'IRON_ORE_CONCENTRATE_CRADLE_UA',
      category: MaterialCategory.IRON_ORE_CONCENTRATE,
      value: '0.075',
      unit: Unit.KG,
      scope: GhgScope.SCOPE_3,
    }),
  ],
  [
    '22222222-2222-2222-2222-222222222222',
    ef({
      key: 'NATURAL_GAS_COMBUSTION',
      category: MaterialCategory.NATURAL_GAS,
      value: '2.02',
      unit: Unit.M3,
      scope: GhgScope.SCOPE_1,
    }),
  ],
  [
    '33333333-3333-3333-3333-333333333333',
    ef({
      key: 'ELECTRICITY_UA_GRID_AVG',
      category: MaterialCategory.ELECTRICITY,
      value: '0.35',
      unit: Unit.KWH,
      scope: GhgScope.SCOPE_2,
      electricitySource: ElectricitySource.UA_GRID_AVG,
    }),
  ],
]);

describe('CalculationEngine', () => {
  const units = new UnitConversionService();
  const engine = new CalculationEngine(units);

  describe('режим ISO 14067', () => {
    it('обчислює PCF з повним Scope 1+2+3', () => {
      const result = engine.calculate(STANDARD_INPUT, STANDARD_EFS);

      // Scope 1 = NG: 5,000,000 m³ × 2.02 = 10,100,000 kg
      expect(new Decimal(result.breakdown.scope1KgCo2e).eq('10100000')).toBe(
        true,
      );
      // Scope 2 = Electricity: 20,000,000 kWh × 0.35 = 7,000,000 kg
      expect(new Decimal(result.breakdown.scope2KgCo2e).eq('7000000')).toBe(
        true,
      );
      // Scope 3 = Concentrate: 100,000 t = 100,000,000 kg × 0.075 = 7,500,000 kg
      expect(new Decimal(result.breakdown.scope3KgCo2e).eq('7500000')).toBe(
        true,
      );
      // Total = 24,600,000
      expect(new Decimal(result.breakdown.totalKgCo2e).eq('24600000')).toBe(
        true,
      );
      // PCF = 24,600,000 / 100,000,000 = 0.246
      expect(new Decimal(result.pcfKgCo2ePerKgPellets).eq('0.246')).toBe(true);
    });

    it('усі 3 рядки збережено зі snapshot EF (audit trail)', () => {
      const result = engine.calculate(STANDARD_INPUT, STANDARD_EFS);

      expect(result.lines).toHaveLength(3);
      const elecLine = result.lines.find(
        (l) => l.inputItemId === '33333333-3333-3333-3333-333333333333',
      );
      expect(elecLine).toBeDefined();
      expect(elecLine?.scope).toBe(GhgScope.SCOPE_2);
      expect(elecLine?.emissionFactor.key).toBe('ELECTRICITY_UA_GRID_AVG');
      expect(elecLine?.emissionFactor.value).toBe('0.35');
      expect(elecLine?.emissionFactor.originalEmissionFactorId).toBe(
        'ef-ELECTRICITY_UA_GRID_AVG',
      );
      expect(typeof elecLine?.emissionFactor.capturedAt).toBe('string');
    });
  });

  describe('режим CBAM', () => {
    it('пропускає Scope 3 EF (concentrate cradle), повертає тільки Scope 1+2', () => {
      const cbamInput: PCFCalculationInput = {
        ...STANDARD_INPUT,
        mode: CalculationMode.CBAM,
      };
      const result = engine.calculate(cbamInput, STANDARD_EFS);

      expect(new Decimal(result.breakdown.scope1KgCo2e).eq('10100000')).toBe(
        true,
      );
      expect(new Decimal(result.breakdown.scope2KgCo2e).eq('7000000')).toBe(
        true,
      );
      expect(new Decimal(result.breakdown.scope3KgCo2e).eq('0')).toBe(true);
      expect(new Decimal(result.breakdown.totalKgCo2e).eq('17100000')).toBe(
        true,
      );
      // PCF = 17,100,000 / 100,000,000 = 0.171
      expect(new Decimal(result.pcfKgCo2ePerKgPellets).eq('0.171')).toBe(true);

      // У результаті — тільки 2 рядки (concentrate Scope 3 не з'являється взагалі).
      expect(result.lines).toHaveLength(2);
      expect(result.lines.map((l) => l.scope).sort()).toEqual([
        GhgScope.SCOPE_1,
        GhgScope.SCOPE_2,
      ]);
    });
  });

  describe('конверсії одиниць у engine', () => {
    it('конвертує input quantity з тонн у кг для EF на kg-basis', () => {
      // Coke: 1500 кг палива × 3.18 kg CO₂e/kg = 4770 kg CO₂e.
      // Якщо інженер ввів 1.5 t — engine має сконвертувати у 1500 kg перед множенням.
      const cokeEf = ef({
        key: 'COKE_COMBUSTION',
        category: MaterialCategory.COKE,
        value: '3.18',
        unit: Unit.KG,
        scope: GhgScope.SCOPE_1,
      });
      const input: PCFCalculationInput = {
        ...STANDARD_INPUT,
        items: [
          {
            id: 'coke-id',
            materialId: 'mat-coke',
            category: MaterialCategory.COKE,
            quantity: '1.5' as DecimalString,
            unit: Unit.TONNE,
          },
        ],
      };
      const efs = new Map<string, EmissionFactorEntity>([['coke-id', cokeEf]]);

      const result = engine.calculate(input, efs);
      expect(new Decimal(result.lines[0].emissionsKgCo2e).eq('4770')).toBe(
        true,
      );
      expect(new Decimal(result.breakdown.scope1KgCo2e).eq('4770')).toBe(true);
    });

    it('кидає 400 при cross-class конверсії (kg → kWh)', () => {
      const wrongEf = ef({
        key: 'WRONG',
        category: MaterialCategory.NATURAL_GAS,
        value: '1',
        unit: Unit.KWH,
        scope: GhgScope.SCOPE_1,
      });
      const input: PCFCalculationInput = {
        ...STANDARD_INPUT,
        items: [
          {
            id: 'wrong-id',
            materialId: 'mat',
            category: MaterialCategory.NATURAL_GAS,
            quantity: '100' as DecimalString,
            unit: Unit.KG,
          },
        ],
      };
      expect(() =>
        engine.calculate(input, new Map([['wrong-id', wrongEf]])),
      ).toThrow(/Не можна конвертувати kg \(mass\) → kWh \(energy\)/);
    });
  });

  describe('валідація', () => {
    it('кидає 400 коли outputMass = 0', () => {
      const input: PCFCalculationInput = {
        ...STANDARD_INPUT,
        process: {
          outputMass: '0' as DecimalString,
          outputMassUnit: Unit.TONNE,
        },
      };
      expect(() => engine.calculate(input, STANDARD_EFS)).toThrow(
        /outputMass має бути > 0/,
      );
    });
  });

  describe('Decimal precision', () => {
    it('зберігає точність на дрібних значеннях (без втрати від Number)', () => {
      // 0.1 + 0.2 у IEEE 754 дає 0.30000000000000004 — у Decimal має бути 0.3.
      const efSmall = ef({
        key: 'SMALL',
        category: MaterialCategory.NATURAL_GAS,
        value: '0.1',
        unit: Unit.M3,
        scope: GhgScope.SCOPE_1,
      });
      const input: PCFCalculationInput = {
        ...STANDARD_INPUT,
        items: [
          {
            id: 'a',
            materialId: 'm',
            category: MaterialCategory.NATURAL_GAS,
            quantity: '1' as DecimalString,
            unit: Unit.M3,
          },
          {
            id: 'b',
            materialId: 'm',
            category: MaterialCategory.NATURAL_GAS,
            quantity: '2' as DecimalString,
            unit: Unit.M3,
          },
        ],
      };
      const efs = new Map<string, EmissionFactorEntity>([
        ['a', efSmall],
        ['b', efSmall],
      ]);
      const result = engine.calculate(input, efs);
      // 1×0.1 + 2×0.1 = 0.3 exactly.
      expect(result.breakdown.scope1KgCo2e).toBe('0.3');
    });
  });
});
