import { Injectable } from '@nestjs/common';
import { stringify } from 'csv-stringify/sync';
import { type PCFCalculation, ReportFormat } from '@pcf/shared';
import type { ReportGenerator, ReportLocale } from './types';

/**
 * CSV-експорт у спрощеному форматі CBAM Quarterly Report.
 *
 * Структура:
 *   - 2 секції розділені порожнім рядком:
 *     - Header: метадані (період, facility, output, embedded emissions)
 *     - Lines: рядки розрахунку з EF snapshot для аудиту
 *   - UTF-8 BOM на початку — щоб MS Excel правильно відкривав кирилицю
 *
 * **Зауваження:** офіційна форма CBAM Quarterly Report має XML/XSD-структуру,
 * визначену в Implementing Reg. (EU) 2023/1773 Annex IV. CSV-експорт тут — це
 * робочий формат для еколога ГЗК, з якого він заповнює офіційну форму.
 */
@Injectable()
export class CsvCbamGenerator implements ReportGenerator {
  readonly format = ReportFormat.CSV_CBAM;
  readonly contentType = 'text/csv; charset=utf-8';
  readonly fileExtension = 'csv';

  generate(calc: PCFCalculation, _locale: ReportLocale): Promise<Buffer> {
    void _locale;

    const headerSection = this.buildHeader(calc);
    const linesSection = this.buildLines(calc);

    const csv =
      stringify(headerSection, { delimiter: ',', quoted_string: true }) +
      '\n' +
      stringify(linesSection, { delimiter: ',', quoted_string: true });

    // BOM для Excel-сумісності (UTF-8).
    return Promise.resolve(
      Buffer.concat([
        Buffer.from([0xef, 0xbb, 0xbf]),
        Buffer.from(csv, 'utf-8'),
      ]),
    );
  }

  private buildHeader(calc: PCFCalculation): string[][] {
    const period = calc.input.period;
    const facility = calc.input.facilityName;
    const mode = calc.input.mode;
    const total = calc.breakdown.totalKgCo2e;
    const scope1 = calc.breakdown.scope1KgCo2e;
    const scope2 = calc.breakdown.scope2KgCo2e;
    const scope3 = calc.breakdown.scope3KgCo2e;
    const outputMass = calc.input.process.outputMass;
    const outputUnit = calc.input.process.outputMassUnit;
    const pcf = calc.pcfKgCo2ePerKgPellets;

    return [
      ['Field', 'Value'],
      [
        'Report Type',
        mode === 'CBAM' ? 'CBAM Quarterly Report' : 'ISO 14067 PCF',
      ],
      ['Calculation ID', calc.id],
      ['Methodology Version', calc.methodologyVersion],
      ['Generated At', calc.createdAt],
      ['Reporting Period Start', period.startDate],
      ['Reporting Period End', period.endDate],
      ['Reporting Period Label', period.label ?? ''],
      ['Facility Name', facility],
      ['Production Line', calc.input.process.productionLineName ?? ''],
      ['Output Mass', outputMass],
      ['Output Mass Unit', outputUnit],
      [
        'Technological Losses Percent',
        calc.input.process.technologicalLossesPercent ?? '',
      ],
      ['Direct Emissions Scope 1 (kg CO2e)', scope1],
      ['Indirect Emissions Scope 2 (kg CO2e)', scope2],
      [
        'Other Indirect Emissions Scope 3 (kg CO2e)',
        mode === 'CBAM' ? '0 (excluded for CBAM)' : scope3,
      ],
      ['Total Emissions (kg CO2e)', total],
      [`Specific Embedded Emissions (kg CO2e per kg ${outputUnit})`, pcf],
      ['Notes', calc.input.notes ?? ''],
    ];
  }

  private buildLines(calc: PCFCalculation): string[][] {
    const header = [
      'Line ID',
      'Category',
      'Input Quantity',
      'Input Unit',
      'Electricity Source',
      'EF Key',
      'EF Name',
      'EF Value',
      'EF Unit',
      'EF Scope',
      'EF Source',
      'EF Year',
      'EF Region',
      'EF Uncertainty %',
      'EF Captured At',
      'Emissions (kg CO2e)',
    ];

    const rows = calc.lines.map((line) => {
      const ef = line.emissionFactor;
      const inputItem = calc.input.items.find((i) => i.id === line.inputItemId);
      return [
        line.inputItemId,
        ef.category,
        inputItem?.quantity ?? '',
        inputItem?.unit ?? '',
        inputItem?.electricitySource ?? '',
        ef.key,
        ef.name,
        ef.value,
        ef.unit,
        ef.scope,
        ef.source,
        ef.year.toString(),
        ef.region,
        ef.uncertaintyPercent ?? '',
        ef.capturedAt,
        line.emissionsKgCo2e,
      ];
    });

    return [header, ...rows];
  }
}
