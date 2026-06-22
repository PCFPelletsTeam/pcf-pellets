import { useQuery } from '@tanstack/react-query';
import { FileJson, FileSpreadsheet, FileText } from 'lucide-react';
import { type Report, ReportFormat } from '@pcf/shared';
import { Loading } from '@/components/common/loading';
import { reportsApi } from '@/lib/api';
import { ReportCard } from './report-card';

const REPORT_TYPES = [
  {
    format: ReportFormat.PDF_ISO_14067,
    icon: FileText,
    title: 'PDF — ISO 14067',
    description:
      'Повний CFP-звіт за ISO 14067:2018 з усіма EF, джерелами, breakdown за scope і audit trail.',
  },
  {
    format: ReportFormat.CSV_CBAM,
    icon: FileSpreadsheet,
    title: 'CSV — CBAM',
    description:
      'CBAM Quarterly Report формат для подачі регулятору (UTF-8 BOM, Excel-сумісний).',
  },
  {
    format: ReportFormat.JSON_CX_0029,
    icon: FileJson,
    title: 'JSON — Catena-X CX-0029',
    description:
      'PCF data exchange формат (спрощена реалізація CX-0029 v2 з кастомним audit-розширенням).',
  },
] as const;

interface ReportsPanelProps {
  calculationId: string;
}

/**
 * Спільний компонент для генерації і завантаження звітів — використовується
 * на Step 6 wizard'a і на `/calculations/:id` детальній сторінці.
 *
 * Завантажує існуючі звіти при mount'і й показує їх стан одразу. При генерації
 * нового — invalidate'ить query, картки оновлюються без перезавантаження.
 */
export function ReportsPanel({ calculationId }: ReportsPanelProps) {
  const reportsQuery = useQuery({
    queryKey: ['reports', calculationId],
    queryFn: () => reportsApi.list({ calculationId, pageSize: 50 }),
  });

  if (reportsQuery.isLoading) return <Loading label="Завантажуємо існуючі звіти…" />;

  // Map для O(1) lookup за format.
  const byFormat = new Map<ReportFormat, Report>(
    (reportsQuery.data?.items ?? []).map((r) => [r.format, r]),
  );

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {REPORT_TYPES.map((rt) => (
        <ReportCard
          key={rt.format}
          calculationId={calculationId}
          format={rt.format}
          icon={rt.icon}
          title={rt.title}
          description={rt.description}
          existingReport={byFormat.get(rt.format)}
        />
      ))}
    </div>
  );
}
