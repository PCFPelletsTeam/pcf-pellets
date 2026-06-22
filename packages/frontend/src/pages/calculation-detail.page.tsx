import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { ErrorMessage, Loading } from '@/components/common/loading';
import { PageHeader } from '@/components/common/page-header';
import { ReportsPanel } from '@/components/reports/reports-panel';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { calculationsApi } from '@/lib/api';
import {
  CATEGORY_LABEL,
  ELECTRICITY_SOURCE_LABEL,
  formatDate,
  formatDateTime,
  formatDecimal,
  MODE_LABEL,
  SCOPE_COLOR,
  SCOPE_LABEL,
  UNIT_LABEL,
} from '@/lib/format';

export default function CalculationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const query = useQuery({
    queryKey: ['calculation', id],
    queryFn: () => calculationsApi.get(id!),
    enabled: !!id,
  });

  if (query.isLoading) return <Loading />;
  if (query.error) return <ErrorMessage error={query.error} />;
  if (!query.data) return null;

  const calc = query.data;

  return (
    <>
      <Button variant="ghost" size="sm" asChild className="mb-3">
        <Link to="/calculations">
          <ArrowLeft className="mr-1 h-3 w-3" /> До списку
        </Link>
      </Button>

      <PageHeader
        title={calc.input.facilityName}
        description={
          calc.input.period.label
            ? `${calc.input.period.label} · створено ${formatDateTime(calc.createdAt)}`
            : `${formatDate(calc.input.period.startDate)} – ${formatDate(calc.input.period.endDate)} · створено ${formatDateTime(calc.createdAt)}`
        }
        actions={
          <Badge variant={calc.input.mode === 'CBAM' ? 'default' : 'secondary'}>
            {MODE_LABEL[calc.input.mode]}
          </Badge>
        }
      />

      {/* Підсумок: PCF + breakdown */}
      <section className="mb-8 grid gap-4 lg:grid-cols-4">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Підсумковий PCF
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tabular-nums">
              {Number(calc.pcfKgCo2ePerKgPellets).toFixed(4)}
            </p>
            <p className="text-sm text-muted-foreground">kg CO₂e на 1 кг окатишів</p>
          </CardContent>
        </Card>

        {(['SCOPE_1', 'SCOPE_2', 'SCOPE_3'] as const).map((scope) => {
          const value =
            scope === 'SCOPE_1'
              ? calc.breakdown.scope1KgCo2e
              : scope === 'SCOPE_2'
                ? calc.breakdown.scope2KgCo2e
                : calc.breakdown.scope3KgCo2e;
          return (
            <Card key={scope}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${SCOPE_COLOR[scope]}`}
                    aria-hidden
                  />
                  {SCOPE_LABEL[scope]}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold tabular-nums">{formatDecimal(value)}</p>
                <p className="text-xs text-muted-foreground">kg CO₂e</p>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="mb-8 rounded-lg border bg-muted/40 p-4">
        <p className="text-sm">
          <span className="font-medium">Загальні викиди:</span>{' '}
          <span className="tabular-nums">
            {formatDecimal(calc.breakdown.totalKgCo2e)} kg CO₂e
          </span>
          {' / '}
          <span className="font-medium">маса продукту:</span>{' '}
          <span className="tabular-nums">
            {formatDecimal(calc.input.process.outputMass)}{' '}
            {UNIT_LABEL[calc.input.process.outputMassUnit]}
          </span>
          {' = '}
          <span className="font-semibold">
            {Number(calc.pcfKgCo2ePerKgPellets).toFixed(4)} kg CO₂e/kg
          </span>
        </p>
        {calc.input.notes && (
          <p className="mt-2 text-sm italic text-muted-foreground">
            «{calc.input.notes}»
          </p>
        )}
      </section>

      {/* Audit trail */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">
          Audit trail — рядки розрахунку ({calc.lines.length})
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Кожен рядок містить immutable snapshot EF на момент розрахунку. Цифри
          відтворювані навіть після оновлення EF DB — обов'язкова вимога
          ISO 14067 / CBAM.
        </p>

        <div className="space-y-3">
          {calc.lines.map((line) => {
            const ef = line.emissionFactor;
            const inputItem = calc.input.items.find((i) => i.id === line.inputItemId);
            return (
              <Card key={line.inputItemId}>
                <CardContent className="pt-6">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-block h-2 w-2 rounded-full ${SCOPE_COLOR[line.scope]}`}
                          aria-hidden
                        />
                        <Badge variant="outline">{SCOPE_LABEL[line.scope]}</Badge>
                        <span className="font-medium">{CATEGORY_LABEL[ef.category]}</span>
                      </div>
                      {inputItem && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          Інпут:{' '}
                          <span className="tabular-nums">
                            {formatDecimal(inputItem.quantity)} {UNIT_LABEL[inputItem.unit]}
                          </span>
                          {inputItem.electricitySource && (
                            <>
                              {' '}
                              · джерело: {ELECTRICITY_SOURCE_LABEL[inputItem.electricitySource]}
                            </>
                          )}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-lg font-semibold tabular-nums">
                        {formatDecimal(line.emissionsKgCo2e)}
                      </p>
                      <p className="text-xs text-muted-foreground">kg CO₂e</p>
                    </div>
                  </div>

                  <Separator className="my-3" />

                  <div className="text-xs">
                    <p className="mb-1 font-medium">EF snapshot</p>
                    <div className="grid gap-x-4 gap-y-0.5 text-muted-foreground sm:grid-cols-2">
                      <div>
                        <span className="text-foreground">key:</span>{' '}
                        <span className="font-mono">{ef.key}</span>
                      </div>
                      <div>
                        <span className="text-foreground">value:</span>{' '}
                        <span className="tabular-nums">{formatDecimal(ef.value)}</span> kg CO₂e/
                        {UNIT_LABEL[ef.unit]}
                      </div>
                      <div>
                        <span className="text-foreground">source:</span> {ef.source}
                        {ef.sourceUrl && (
                          <a
                            href={ef.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-1 inline-flex items-center gap-0.5 text-primary hover:underline"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                      <div>
                        <span className="text-foreground">year:</span> {ef.year} ·{' '}
                        <span className="text-foreground">region:</span> {ef.region}
                      </div>
                      {ef.uncertaintyPercent && (
                        <div>
                          <span className="text-foreground">uncertainty:</span> ±
                          {ef.uncertaintyPercent}%
                        </div>
                      )}
                      <div>
                        <span className="text-foreground">captured:</span>{' '}
                        {formatDateTime(ef.capturedAt)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-1 text-lg font-semibold">Експорт звітів</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Згенеровані файли зберігаються разом із розрахунком. Якщо EF DB змінилася —
          натисніть «Перегенерувати», щоб оновити документ із поточним snapshot'ом.
          (Числа PCF при цьому не зміняться — у розрахунку зафіксовано власний snapshot.)
        </p>
        <ReportsPanel calculationId={calc.id} />
      </section>
    </>
  );
}
