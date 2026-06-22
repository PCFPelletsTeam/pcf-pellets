import { useQuery } from '@tanstack/react-query';
import { Calculator } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import { ErrorMessage, Empty, Loading } from '@/components/common/loading';
import { PageHeader } from '@/components/common/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { calculationsApi } from '@/lib/api';
import { formatDateTime, MODE_LABEL } from '@/lib/format';
import type { CalculationMode } from '@pcf/shared';

export default function CalculationsListPage() {
  const [mode, setMode] = useState<CalculationMode | 'ALL'>('ALL');

  const query = useQuery({
    queryKey: ['calculations', { mode }],
    queryFn: () =>
      calculationsApi.list({
        mode: mode === 'ALL' ? undefined : mode,
        pageSize: 50,
      }),
  });

  return (
    <>
      <PageHeader
        title="PCF-розрахунки"
        description="Усі збережені розрахунки. Кожен містить повний audit trail з EF snapshot'ами."
        actions={
          <Button asChild>
            <Link to="/calculations/new">
              <Calculator className="mr-2 h-4 w-4" />
              Новий розрахунок
            </Link>
          </Button>
        }
      />

      <div className="mb-4">
        <Select value={mode} onValueChange={(v) => setMode(v as CalculationMode | 'ALL')}>
          <SelectTrigger className="max-w-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Усі режими</SelectItem>
            <SelectItem value="ISO_14067">{MODE_LABEL.ISO_14067}</SelectItem>
            <SelectItem value="CBAM">{MODE_LABEL.CBAM}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {query.isLoading && <Loading />}
      {query.error && <ErrorMessage error={query.error} />}
      {query.data && query.data.items.length === 0 && (
        <Empty
          title="Розрахунків ще немає"
          description="Створіть перший розрахунок через wizard"
          action={
            <Button asChild>
              <Link to="/calculations/new">Новий розрахунок</Link>
            </Button>
          }
        />
      )}
      {query.data && query.data.items.length > 0 && (
        <div className="space-y-2">
          {query.data.items.map((calc) => (
            <Link
              key={calc.id}
              to={`/calculations/${calc.id}`}
              className="block"
            >
              <Card className="transition-colors hover:border-primary/50">
                <CardContent className="flex items-center justify-between gap-4 py-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-medium">{calc.input.facilityName}</p>
                      <Badge
                        variant={calc.input.mode === 'CBAM' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {MODE_LABEL[calc.input.mode]}
                      </Badge>
                    </div>
                    <p className="mt-1 truncate text-sm text-muted-foreground">
                      {calc.input.period.label ??
                        `${calc.input.period.startDate} – ${calc.input.period.endDate}`}{' '}
                      · {calc.input.items.length} item(s) · methodology v
                      {calc.methodologyVersion} · {formatDateTime(calc.createdAt)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-xl font-semibold tabular-nums">
                      {Number(calc.pcfKgCo2ePerKgPellets).toFixed(3)}
                    </p>
                    <p className="text-xs text-muted-foreground">kg CO₂e/kg pellets</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {query.data && (
        <p className="mt-4 text-xs text-muted-foreground">
          Всього: {query.data.total} розрахунк(ів)
        </p>
      )}
    </>
  );
}
