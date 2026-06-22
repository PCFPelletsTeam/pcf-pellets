import { Injectable } from '@nestjs/common';
import { type PCFCalculation, ReportFormat } from '@pcf/shared';
import type { ReportGenerator, ReportLocale } from './types';

/**
 * JSON-експорт у спрощеному форматі **Catena-X CX-0029** (Product Carbon Footprint
 * Rule Book v2.x).
 *
 * Реалізовано спрощену структуру:
 *   - `specVersion`, `id` — обов'язкові метадані версії специфікації
 *   - `pcf` — PCF-секція (declaredUnit / unitaryProductAmount / pCfExcludingBiogenic / fossilGhgEmissions)
 *   - `productOrSectorSpecificRules` — стандарти, що застосовані
 *   - `extensions.audit` — кастомне розширення з повним audit trail
 *     (input items + EF snapshots), якого немає у базовій CX-0029 spec але
 *     потрібного для перевірки регулятором
 *
 * **Це часткова імплементація** для дипломної. Повну CX-0029 spec можна знайти на
 * https://catena-x.net/en/standard-library — для production-deploy потрібна
 * валідація проти офіційного JSON Schema.
 */
@Injectable()
export class JsonCx0029Generator implements ReportGenerator {
  readonly format = ReportFormat.JSON_CX_0029;
  readonly contentType = 'application/json';
  readonly fileExtension = 'json';

  generate(calc: PCFCalculation, _locale: ReportLocale): Promise<Buffer> {
    void _locale;
    const document = this.buildDocument(calc);
    const json = JSON.stringify(document, null, 2);
    return Promise.resolve(Buffer.from(json, 'utf-8'));
  }

  private buildDocument(calc: PCFCalculation): Cx0029Document {
    const pcf = Number(calc.pcfKgCo2ePerKgPellets);
    const scope1 = Number(calc.breakdown.scope1KgCo2e);
    const scope2 = Number(calc.breakdown.scope2KgCo2e);
    const scope3 = Number(calc.breakdown.scope3KgCo2e);
    const total = scope1 + scope2 + scope3;
    const outputMassKg = this.toKg(
      Number(calc.input.process.outputMass),
      calc.input.process.outputMassUnit,
    );

    return {
      specVersion: '2.0.0',
      partialFullPcf: 'Cradle-to-gate',
      id: calc.id,
      created: calc.createdAt,
      productOrSectorSpecificRules: [
        {
          operator: 'ISO',
          ruleNames: ['ISO 14067:2018'],
        },
      ],
      productCategoryCpc: '41123', // CPC 41123 — Iron ores and concentrates
      productNameCompany: calc.input.facilityName,
      productIds: [`urn:pcf-pellets:calc:${calc.id}`],
      pcf: {
        declaredUnit: 'kilogram',
        unitaryProductAmount: '1.0',
        pCfExcludingBiogenic: pcf,
        pCfIncludingBiogenic: pcf, // біогенний C для окатишів ≈ 0
        fossilGhgEmissions: pcf,
        biogenicCarbonContent: 0,
        biogenicCarbonWithdrawal: 0,
        characterizationFactors: 'AR6',
        crossSectoralStandardsUsed: [
          'GHG Protocol Product Standard',
          'ISO 14067',
        ],
        boundaryProcessesDescription:
          calc.input.mode === 'CBAM'
            ? 'CBAM scope: Scope 1 + Scope 2. Scope 3 (upstream) виключено.'
            : 'Cradle-to-gate: Scope 1 + 2 + 3 (upstream).',
        referencePeriodStart: `${calc.input.period.startDate}T00:00:00Z`,
        referencePeriodEnd: `${calc.input.period.endDate}T23:59:59Z`,
        geographyCountrySubdivision: 'UA',
      },
      extensions: {
        // Кастомне розширення для audit trail (не частина базової CX-0029).
        'urn:pcf-pellets:audit:v1': {
          mode: calc.input.mode,
          methodologyVersion: calc.methodologyVersion,
          totalEmissionsKgCo2e: total,
          outputMassKg,
          breakdown: {
            scope1KgCo2e: scope1,
            scope2KgCo2e: scope2,
            scope3KgCo2e: scope3,
            totalKgCo2e: total,
          },
          inputs: calc.input.items.map((item) => ({
            id: item.id,
            category: item.category,
            quantity: item.quantity,
            unit: item.unit,
            electricitySource: item.electricitySource,
            notes: item.notes,
          })),
          calculationLines: calc.lines.map((line) => ({
            inputItemId: line.inputItemId,
            scope: line.scope,
            emissionsKgCo2e: line.emissionsKgCo2e,
            emissionFactor: {
              key: line.emissionFactor.key,
              name: line.emissionFactor.name,
              value: line.emissionFactor.value,
              unit: line.emissionFactor.unit,
              source: line.emissionFactor.source,
              sourceUrl: line.emissionFactor.sourceUrl,
              year: line.emissionFactor.year,
              region: line.emissionFactor.region,
              uncertaintyPercent: line.emissionFactor.uncertaintyPercent,
              capturedAt: line.emissionFactor.capturedAt,
            },
          })),
        },
      },
    };
  }

  private toKg(value: number, unit: string): number {
    if (unit === 'kg') return value;
    if (unit === 't') return value * 1000;
    return value; // інші не очікуємо у outputMass
  }
}

interface Cx0029Document {
  specVersion: string;
  partialFullPcf: 'Cradle-to-gate' | 'Cradle-to-grave';
  id: string;
  created: string;
  productOrSectorSpecificRules: Array<{
    operator: string;
    ruleNames: string[];
  }>;
  productCategoryCpc: string;
  productNameCompany: string;
  productIds: string[];
  pcf: {
    declaredUnit: string;
    unitaryProductAmount: string;
    pCfExcludingBiogenic: number;
    pCfIncludingBiogenic: number;
    fossilGhgEmissions: number;
    biogenicCarbonContent: number;
    biogenicCarbonWithdrawal: number;
    characterizationFactors: string;
    crossSectoralStandardsUsed: string[];
    boundaryProcessesDescription: string;
    referencePeriodStart: string;
    referencePeriodEnd: string;
    geographyCountrySubdivision: string;
  };
  extensions: Record<string, unknown>;
}
