import * as path from 'node:path';
import { Injectable, Logger } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { type PCFCalculation, ReportFormat } from '@pcf/shared';
import type { ReportGenerator, ReportLocale } from './types';

// Roboto TTF файли з cyrillic-діапазоном поставляються разом з pdfmake.
// Ми не використовуємо pdfmake.js (той browser-only у v0.3), а беремо тільки шрифти.
const PDFMAKE_DIR = path.dirname(require.resolve('pdfmake/package.json'));
const ROBOTO = {
  regular: path.join(PDFMAKE_DIR, 'fonts', 'Roboto', 'Roboto-Regular.ttf'),
  bold: path.join(PDFMAKE_DIR, 'fonts', 'Roboto', 'Roboto-Medium.ttf'),
  italic: path.join(PDFMAKE_DIR, 'fonts', 'Roboto', 'Roboto-Italic.ttf'),
};

const COLOR = {
  primary: '#16a34a',
  text: '#0f172a',
  muted: '#64748b',
  border: '#e2e8f0',
  scope1: '#f97316',
  scope2: '#3b82f6',
  scope3: '#a855f7',
  bgRow: '#f8fafc',
};

/**
 * PDF-звіт за ISO 14067:2018 через pdfkit (низькорівневий, але cross-platform).
 *
 * Layout:
 *   1. Cover: заголовок, facility, період, режим, мета-таблиця
 *   2. KPI: PCF, Total, output mass великими цифрами
 *   3. Breakdown за GHG Scope (таблиця)
 *   4. Audit trail (таблиця всіх рядків з EF snapshot)
 *   5. Список використаних EF з джерелами
 *   6. Footer (methodology version, дата, audit-trail дисклеймер)
 *
 * Кирилиця через Roboto-Regular/Medium TTF з node_modules/pdfmake/fonts/Roboto/.
 */
@Injectable()
export class PdfIso14067Generator implements ReportGenerator {
  private readonly logger = new Logger(PdfIso14067Generator.name);
  readonly format = ReportFormat.PDF_ISO_14067;
  readonly contentType = 'application/pdf';
  readonly fileExtension = 'pdf';

  async generate(calc: PCFCalculation, _locale: ReportLocale): Promise<Buffer> {
    void _locale;
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
      info: {
        Title: `PCF Report — ${calc.input.facilityName}`,
        Author: 'PCF Pellets Calculator',
        Subject:
          calc.input.mode === 'CBAM'
            ? 'CBAM Quarterly Report'
            : 'ISO 14067 Carbon Footprint of Products',
        Keywords: 'PCF, ISO 14067, CBAM, iron ore pellets',
      },
    });

    doc.registerFont('Roboto', ROBOTO.regular);
    doc.registerFont('Roboto-Bold', ROBOTO.bold);
    doc.registerFont('Roboto-Italic', ROBOTO.italic);
    doc.font('Roboto');

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    const done = new Promise<Buffer>((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });

    this.renderCover(doc, calc);
    this.renderKpi(doc, calc);
    this.renderBreakdown(doc, calc);
    doc.addPage();
    this.renderAuditTrail(doc, calc);
    this.renderSources(doc, calc);
    this.renderFooter(doc, calc);

    doc.end();
    const buffer = await done;
    this.logger.log(
      `PDF згенеровано: ${buffer.length} bytes для calc=${calc.id}`,
    );
    return buffer;
  }

  // ---------- sections ----------

  private renderCover(doc: PDFKit.PDFDocument, calc: PCFCalculation): void {
    const isCbam = calc.input.mode === 'CBAM';
    doc
      .font('Roboto-Bold')
      .fontSize(22)
      .fillColor(COLOR.primary)
      .text(
        isCbam
          ? 'Звіт CBAM (Reg. EU 2023/956)'
          : 'Звіт Product Carbon Footprint (ISO 14067:2018)',
        { align: 'left' },
      );
    doc
      .moveDown(0.3)
      .font('Roboto')
      .fontSize(12)
      .fillColor(COLOR.muted)
      .text('Виробництво залізорудних окатишів');
    doc.moveDown(1);

    const period = calc.input.period;
    const periodLabel =
      period.label ?? `${period.startDate} – ${period.endDate}`;
    const meta: [string, string][] = [
      ['Підприємство', calc.input.facilityName],
      ['Звітний період', periodLabel],
      ['Дати періоду', `${period.startDate} – ${period.endDate}`],
      [
        'Режим розрахунку',
        isCbam ? 'CBAM (Scope 1+2)' : 'ISO 14067 (Scope 1+2+3)',
      ],
      ['Версія методології', `v${calc.methodologyVersion}`],
      ['Згенеровано', new Date().toISOString()],
      ['ID розрахунку', calc.id],
    ];
    this.renderMetaTable(doc, meta);
    doc.moveDown(1);
  }

  private renderMetaTable(
    doc: PDFKit.PDFDocument,
    rows: [string, string][],
  ): void {
    const startX = doc.page.margins.left;
    const colW =
      (doc.page.width - doc.page.margins.left - doc.page.margins.right) * 0.3;
    const lineHeight = 18;
    rows.forEach(([k, v]) => {
      const y = doc.y;
      doc
        .font('Roboto-Bold')
        .fontSize(10)
        .fillColor(COLOR.text)
        .text(k, startX, y, {
          width: colW,
          continued: false,
        });
      doc
        .font('Roboto')
        .fontSize(10)
        .fillColor(COLOR.text)
        .text(v, startX + colW + 8, y, {
          width: doc.page.width - doc.page.margins.right - (startX + colW + 8),
        });
      doc
        .moveTo(startX, doc.y + 2)
        .lineTo(doc.page.width - doc.page.margins.right, doc.y + 2)
        .strokeColor(COLOR.border)
        .lineWidth(0.5)
        .stroke();
      doc.y = Math.max(doc.y + 4, y + lineHeight);
    });
  }

  private renderKpi(doc: PDFKit.PDFDocument, calc: PCFCalculation): void {
    doc
      .moveDown(1)
      .font('Roboto-Bold')
      .fontSize(14)
      .fillColor(COLOR.text)
      .text('Підсумкові показники');
    doc.moveDown(0.5);

    const pcf = Number(calc.pcfKgCo2ePerKgPellets);
    const total = Number(calc.breakdown.totalKgCo2e);
    const cells: {
      label: string;
      value: string;
      sub: string;
      color: string;
    }[] = [
      {
        label: 'PCF',
        value: pcf.toFixed(4),
        sub: 'kg CO₂e / kg окатишів',
        color: COLOR.primary,
      },
      {
        label: 'Загалом',
        value: formatNum(total, 0),
        sub: 'kg CO₂e',
        color: COLOR.text,
      },
      {
        label: 'Маса продукту',
        value: `${calc.input.process.outputMass} ${calc.input.process.outputMassUnit}`,
        sub: '',
        color: COLOR.text,
      },
    ];

    const startX = doc.page.margins.left;
    const usableW =
      doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const cellW = (usableW - 2 * 12) / 3;
    const cellH = 65;
    const startY = doc.y;
    cells.forEach((c, i) => {
      const x = startX + i * (cellW + 12);
      doc.roundedRect(x, startY, cellW, cellH, 4).fillColor(COLOR.bgRow).fill();
      doc
        .font('Roboto')
        .fontSize(9)
        .fillColor(COLOR.muted)
        .text(c.label, x + 10, startY + 8);
      doc
        .font('Roboto-Bold')
        .fontSize(20)
        .fillColor(c.color)
        .text(c.value, x + 10, startY + 22);
      if (c.sub) {
        doc
          .font('Roboto')
          .fontSize(8)
          .fillColor(COLOR.muted)
          .text(c.sub, x + 10, startY + 48, { width: cellW - 20 });
      }
    });
    doc.y = startY + cellH + 16;
    doc.fillColor(COLOR.text);
  }

  private renderBreakdown(doc: PDFKit.PDFDocument, calc: PCFCalculation): void {
    const isCbam = calc.input.mode === 'CBAM';
    doc.moveDown(0.5);
    doc
      .font('Roboto-Bold')
      .fontSize(14)
      .fillColor(COLOR.text)
      .text('Розклад за GHG Scope');
    doc.moveDown(0.5);

    const total = Number(calc.breakdown.totalKgCo2e);
    const rows = [
      {
        name: 'Scope 1 (прямі)',
        value: Number(calc.breakdown.scope1KgCo2e),
        color: COLOR.scope1,
      },
      {
        name: 'Scope 2 (енергетичні)',
        value: Number(calc.breakdown.scope2KgCo2e),
        color: COLOR.scope2,
      },
      {
        name: isCbam
          ? 'Scope 3 (виключено для CBAM)'
          : 'Scope 3 (інші непрямі)',
        value: Number(calc.breakdown.scope3KgCo2e),
        color: COLOR.scope3,
      },
    ];

    const headers = ['Scope', 'Викиди (kg CO₂e)', '%'];
    const widths = [0.55, 0.27, 0.18];
    this.renderTableHeader(doc, headers, widths);
    rows.forEach((r) => {
      this.renderTableRow(
        doc,
        [
          r.name,
          formatNum(r.value, 0),
          total > 0 ? `${((r.value / total) * 100).toFixed(1)}%` : '—',
        ],
        widths,
        {
          firstColColor: r.color,
        },
      );
    });
    this.renderTableRow(doc, ['Разом', formatNum(total, 0), '100%'], widths, {
      bold: true,
    });
  }

  private renderAuditTrail(
    doc: PDFKit.PDFDocument,
    calc: PCFCalculation,
  ): void {
    doc
      .font('Roboto-Bold')
      .fontSize(14)
      .fillColor(COLOR.text)
      .text(`Audit trail — детальний розклад (${calc.lines.length} рядк.)`);
    doc.moveDown(0.5);

    const headers = ['Категорія', 'EF', 'Кількість', 'Scope', 'kg CO₂e'];
    const widths = [0.2, 0.32, 0.2, 0.13, 0.15];
    this.renderTableHeader(doc, headers, widths);

    calc.lines.forEach((line) => {
      const item = calc.input.items.find((i) => i.id === line.inputItemId);
      const ef = line.emissionFactor;
      this.renderTableRow(
        doc,
        [
          ef.category,
          `${ef.key}\n${formatNum(Number(ef.value), 4)} /${ef.unit}`,
          item ? `${item.quantity} ${item.unit}` : '—',
          line.scope.replace('_', ' '),
          formatNum(Number(line.emissionsKgCo2e), 0),
        ],
        widths,
        {
          fontSize: 8,
          alignmentByCol: ['left', 'left', 'right', 'center', 'right'],
        },
      );
    });
    doc.moveDown(1);
  }

  private renderSources(doc: PDFKit.PDFDocument, calc: PCFCalculation): void {
    const unique = Array.from(
      new Map(
        calc.lines.map((l) => [
          l.emissionFactor.key,
          {
            key: l.emissionFactor.key,
            value: l.emissionFactor.value,
            unit: l.emissionFactor.unit,
            source: l.emissionFactor.source,
            year: l.emissionFactor.year,
            region: l.emissionFactor.region,
          },
        ]),
      ).values(),
    );
    doc.moveDown(0.5);
    doc
      .font('Roboto-Bold')
      .fontSize(14)
      .fillColor(COLOR.text)
      .text('Використані Emission Factors');
    doc.moveDown(0.5);
    unique.forEach((s) => {
      doc
        .font('Roboto-Bold')
        .fontSize(8)
        .fillColor(COLOR.text)
        .text(s.key, { continued: true })
        .font('Roboto')
        .fillColor(COLOR.muted)
        .text(` — ${s.value} kg CO₂e/${s.unit} · `, { continued: true })
        .font('Roboto-Italic')
        .text(s.source, { continued: true })
        .font('Roboto')
        .text(` · ${s.year}, ${s.region}`);
    });

    if (calc.input.notes) {
      doc.moveDown(1);
      doc
        .font('Roboto-Bold')
        .fontSize(14)
        .fillColor(COLOR.text)
        .text('Нотатки');
      doc.moveDown(0.3);
      doc
        .font('Roboto-Italic')
        .fontSize(10)
        .fillColor(COLOR.muted)
        .text(calc.input.notes);
    }
  }

  private renderFooter(doc: PDFKit.PDFDocument, calc: PCFCalculation): void {
    doc.moveDown(2);
    doc
      .font('Roboto')
      .fontSize(7)
      .fillColor('#94a3b8')
      .text(
        `Звіт згенеровано системою PCF Pellets · methodology v${calc.methodologyVersion} · ` +
          `EF snapshot'и зафіксовано на момент розрахунку (вимога ISO 14067 / CBAM щодо відтворюваності).`,
        { align: 'center' },
      );
  }

  // ---------- table helpers ----------

  private renderTableHeader(
    doc: PDFKit.PDFDocument,
    headers: string[],
    widths: number[],
  ): void {
    const startX = doc.page.margins.left;
    const usableW =
      doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const y = doc.y;
    doc.rect(startX, y, usableW, 20).fillColor('#f1f5f9').fill();
    let x = startX + 6;
    headers.forEach((h, i) => {
      const w = usableW * widths[i];
      doc
        .font('Roboto-Bold')
        .fontSize(9)
        .fillColor(COLOR.text)
        .text(h, x, y + 6, { width: w - 8 });
      x += w;
    });
    doc.y = y + 24;
    doc.fillColor(COLOR.text);
  }

  private renderTableRow(
    doc: PDFKit.PDFDocument,
    values: string[],
    widths: number[],
    opts: {
      bold?: boolean;
      fontSize?: number;
      firstColColor?: string;
      alignmentByCol?: ('left' | 'right' | 'center')[];
    } = {},
  ): void {
    const startX = doc.page.margins.left;
    const usableW =
      doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const fontSize = opts.fontSize ?? 9;
    const font = opts.bold ? 'Roboto-Bold' : 'Roboto';
    const yStart = doc.y;
    let x = startX + 6;
    let maxBottom = yStart;
    values.forEach((v, i) => {
      const w = usableW * widths[i];
      const align = opts.alignmentByCol?.[i] ?? 'left';
      const color =
        i === 0 && opts.firstColColor ? opts.firstColColor : COLOR.text;
      doc
        .font(font)
        .fontSize(fontSize)
        .fillColor(color)
        .text(v, x, yStart + 4, { width: w - 8, align });
      maxBottom = Math.max(maxBottom, doc.y);
      x += w;
    });
    doc.y = maxBottom + 4;
    doc
      .moveTo(startX, doc.y)
      .lineTo(doc.page.width - doc.page.margins.right, doc.y)
      .strokeColor(COLOR.border)
      .lineWidth(0.5)
      .stroke();
    doc.y += 4;
    doc.fillColor(COLOR.text);
  }
}

function formatNum(value: number, decimals: number): string {
  const fixed = value.toFixed(decimals);
  const [intPart, fracPart] = fixed.split('.');
  const grouped = (intPart ?? '0').replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return fracPart ? `${grouped}.${fracPart}` : grouped;
}
