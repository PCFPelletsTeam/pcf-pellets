import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Calculator, Database, Factory } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ErrorMessage, Loading } from '@/components/common/loading';
import { PageHeader } from '@/components/common/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { appApi, calculationsApi } from '@/lib/api';
import { formatDateTime, MODE_LABEL } from '@/lib/format';

export default function HomePage() {
  const infoQuery = useQuery({
    queryKey: ['app-info'],
    queryFn: appApi.info,
    retry: 1,
  });
  const recentQuery = useQuery({
    queryKey: ['calculations', { recent: true }],
    queryFn: () => calculationsApi.list({ pageSize: 5 }),
  });

  return (
    <>
      <PageHeader
        title="PCF Pellets — огляд"
        description="Розрахунок Product Carbon Footprint (PCF) для виробництва залізорудних окатишів"
        actions={
          <Button asChild>
            <Link to="/calculations/new">
              <Calculator className="mr-2 h-4 w-4" />
              Новий розрахунок
            </Link>
          </Button>
        }
      />

      <section className="mb-8 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Стан backend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {infoQuery.isLoading && <Loading />}
            {infoQuery.error && <ErrorMessage error={infoQuery.error} />}
            {infoQuery.data && (
              <>
                <p className="text-lg font-semibold">{infoQuery.data.name}</p>
                <p className="text-sm text-muted-foreground">
                  v{infoQuery.data.version} · methodology v{infoQuery.data.methodologyVersion}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Підтримувані стандарти
            </CardTitle>
          </CardHeader>
          <CardContent>
            {infoQuery.data && (
              <div className="flex flex-wrap gap-1.5">
                {infoQuery.data.supportedStandards.map((std) => (
                  <Badge key={std} variant="secondary" className="text-xs">
                    {std}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Останні розрахунки
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{recentQuery.data?.total ?? '—'}</p>
            <p className="text-sm text-muted-foreground">збережено в БД</p>
          </CardContent>
        </Card>
      </section>

      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Останні розрахунки</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/calculations">
              Усі <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </Button>
        </div>
        {recentQuery.isLoading && <Loading />}
        {recentQuery.error && <ErrorMessage error={recentQuery.error} />}
        {recentQuery.data && recentQuery.data.items.length === 0 && (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Розрахунків ще немає.{' '}
              <Link to="/calculations/new" className="text-primary hover:underline">
                Створити перший
              </Link>
              .
            </CardContent>
          </Card>
        )}
        {recentQuery.data && recentQuery.data.items.length > 0 && (
          <div className="space-y-2">
            {recentQuery.data.items.map((calc) => (
              <Link
                key={calc.id}
                to={`/calculations/${calc.id}`}
                className="block rounded-lg border bg-card p-4 transition-colors hover:border-primary/50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{calc.input.facilityName}</p>
                    <p className="text-sm text-muted-foreground">
                      {MODE_LABEL[calc.input.mode]} ·{' '}
                      {calc.input.period.label ??
                        `${calc.input.period.startDate} – ${calc.input.period.endDate}`}{' '}
                      · {formatDateTime(calc.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold tabular-nums">
                      {Number(calc.pcfKgCo2ePerKgPellets).toFixed(3)}
                    </p>
                    <p className="text-xs text-muted-foreground">kg CO₂e/kg</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Factory className="h-4 w-4 text-primary" /> Довідник матеріалів
            </CardTitle>
            <CardDescription>10 типових матеріалів та енергоносіїв виробництва</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" asChild>
              <Link to="/materials">Відкрити</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Database className="h-4 w-4 text-primary" /> EF довідник
            </CardTitle>
            <CardDescription>
              12 emission factors з джерелами (DEFRA / IPCC / CBAM defaults)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" size="sm" asChild>
              <Link to="/emission-factors">Відкрити</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </>
  );
}
