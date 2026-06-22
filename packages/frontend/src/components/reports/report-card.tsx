import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  Download,
  Loader2,
  RefreshCw,
  type LucideIcon,
} from 'lucide-react';
import { type Report, type ReportFormat } from '@pcf/shared';
import { ErrorMessage } from '@/components/common/loading';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { reportsApi } from '@/lib/api';
import { formatDateTime } from '@/lib/format';

export interface ReportCardProps {
  calculationId: string;
  format: ReportFormat;
  icon: LucideIcon;
  title: string;
  description: string;
  /** Якщо звіт уже згенеровано — показуємо його метадані одразу. */
  existingReport?: Report;
}

export function ReportCard({
  calculationId,
  format,
  icon: Icon,
  title,
  description,
  existingReport,
}: ReportCardProps) {
  const queryClient = useQueryClient();

  const generateMutation = useMutation({
    mutationFn: () =>
      reportsApi.generate({ calculationId, format, locale: 'uk' }),
    onSuccess: (report) => {
      // Оновити список звітів (щоб картка з 'existingReport' оновилася).
      void queryClient.invalidateQueries({
        queryKey: ['reports', calculationId],
      });
      // Запустити завантаження.
      window.location.href = reportsApi.fileUrl(report.id);
    },
  });

  const handleDownload = () => {
    if (existingReport) {
      window.location.href = reportsApi.fileUrl(existingReport.id);
    }
  };

  const handleGenerate = () => {
    generateMutation.mutate();
  };

  const isPending = generateMutation.isPending;
  const hasReport = !!existingReport;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-5 w-5 text-primary" /> {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {hasReport && !isPending && (
          <div className="flex flex-col gap-2">
            <Button size="sm" onClick={handleDownload} className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Завантажити ({(existingReport.sizeBytes / 1024).toFixed(1)} KB)
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleGenerate}
              className="w-full text-xs text-muted-foreground"
            >
              <RefreshCw className="mr-2 h-3 w-3" />
              Перегенерувати
            </Button>
          </div>
        )}

        {!hasReport && (
          <Button
            size="sm"
            onClick={handleGenerate}
            disabled={isPending}
            className="w-full"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Генеруємо…
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Згенерувати та завантажити
              </>
            )}
          </Button>
        )}

        {hasReport && (
          <p className="flex flex-col gap-0.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-primary" />
              згенеровано {formatDateTime(existingReport.createdAt)}
            </span>
            <span className="font-mono">
              sha256: {existingReport.contentHash.slice(0, 16)}…
            </span>
          </p>
        )}

        {generateMutation.error && <ErrorMessage error={generateMutation.error} />}
      </CardContent>
    </Card>
  );
}
