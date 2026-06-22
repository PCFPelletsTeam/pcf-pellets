import { useMutation } from '@tanstack/react-query';
import { ArrowRight, Loader2, RefreshCcw } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useFormContext } from 'react-hook-form';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { GhgScope, PCFCalculation, PCFCalculationInput } from '@pcf/shared';
import { ErrorMessage } from '@/components/common/loading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { calculationsApi } from '@/lib/api';
import {
  CATEGORY_LABEL,
  ELECTRICITY_SOURCE_LABEL,
  formatDecimal,
  MODE_LABEL,
  SCOPE_COLOR,
  SCOPE_LABEL,
  UNIT_LABEL,
} from '@/lib/format';
import type { WizardFormData } from './schema';

const SCOPE_HEX: Record<GhgScope, string> = {
  SCOPE_1: '#f97316', // orange
  SCOPE_2: '#3b82f6', // blue
  SCOPE_3: '#a855f7', // purple
};

interface Step5Props {
  /** Передаємо саме створений calculation наверх — щоб Step 6 знав id для посилання. */
  onCalculationReady: (calc: PCFCalculation) => void;
  /** Сам calculation (зберігається в state Wizard'а між steps 5↔6). */
  calculation: PCFCalculation | null;
}

export function Step5Results({ onCalculationReady, calculation }: Step5Props) {
  const form = useFormContext<WizardFormData>();
  const hasFiredRef = useRef(false);

  const mutation = useMutation({
    mutationFn: (body: PCFCalculationInput) => calculationsApi.create(body),
    onSuccess: (data) => onCalculationReady(data),
  });

  // Auto-POST на mount (один раз). Якщо вже є calculation — re-fire не робимо.
  useEffect(() => {
    if (calculation || hasFiredRef.current) return;
    hasFiredRef.current = true;
    mutation.mutate(toApiBody(form.getValues()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRecalculate = () => {
    hasFiredRef.current = true;
    mutation.mutate(toApiBody(form.getValues()));
  };

  if (mutation.isPending && !calculation) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm">Виконуємо розрахунок на сервері…</p>
      </div>
    );
  }

  if (mutation.isError && !calculation) {
    return (
      <div className="space-y-4">
        <ErrorMessage error={mutation.error} />
        <Button variant="outline" onClick={handleRecalculate}>
          <RefreshCcw className="mr-2 h-4 w-4" /> Спробувати ще раз
        </Button>
      </div>
    );
  }

  if (!calculation) return null;

  const chartData = [
    {
      name: 'Scope 1',
      value: Number(calculation.breakdown.scope1KgCo2e),
      scope: 'SCOPE_1' as const,
    },
    {
      name: 'Scope 2',
      value: Number(calculation.breakdown.scope2KgCo2e),
      scope: 'SCOPE_2' as const,
    },
    {
      name: 'Scope 3',
      value: Number(calculation.breakdown.scope3KgCo2e),
      scope: 'SCOPE_3' as const,
    },
  ];

  return (
    <div className="space-y-6">
      {/* PCF + breakdown KPI */}
      <div className="grid gap-4 lg:grid-cols-4">
        <Card className="lg:col-span-1 border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Підсумковий PCF
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold tabular-nums text-primary">
              {Number(calculation.pcfKgCo2ePerKgPellets).toFixed(4)}
            </p>
            <p className="text-sm text-muted-foreground">kg CO₂e на 1 кг окатишів</p>
            <Badge variant="secondary" className="mt-2 text-xs">
              {MODE_LABEL[calculation.input.mode]}
            </Badge>
          </CardContent>
        </Card>

        {(['SCOPE_1', 'SCOPE_2', 'SCOPE_3'] as const).map((scope) => {
          const value =
            scope === 'SCOPE_1'
              ? calculation.breakdown.scope1KgCo2e
              : scope === 'SCOPE_2'
                ? calculation.breakdown.scope2KgCo2e
                : calculation.breakdown.scope3KgCo2e;
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
      </div>

      {/* Recharts breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Розподіл викидів за GHG Scope</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis
                  className="text-xs"
                  tickFormatter={(v: number) => formatDecimal(String(v))}
                />
                <Tooltip
                  formatter={(v: number) => [`${formatDecimal(String(v))} kg CO₂e`, 'Викиди']}
                  labelClassName="text-foreground"
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                  }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((d) => (
                    <Cell key={d.scope} fill={SCOPE_HEX[d.scope]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Audit trail table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">
            Audit trail — {calculation.lines.length} рядк(ів)
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRecalculate}
            disabled={mutation.isPending}
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Перерахувати
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-2 py-2 font-medium">Категорія</th>
                  <th className="px-2 py-2 font-medium">Інпут</th>
                  <th className="px-2 py-2 font-medium">EF</th>
                  <th className="px-2 py-2 text-right font-medium">Викиди</th>
                  <th className="px-2 py-2 font-medium">Scope</th>
                </tr>
              </thead>
              <tbody>
                {calculation.lines.map((line) => {
                  const item = calculation.input.items.find((i) => i.id === line.inputItemId);
                  return (
                    <tr key={line.inputItemId} className="border-b last:border-0">
                      <td className="px-2 py-2">{CATEGORY_LABEL[line.emissionFactor.category]}</td>
                      <td className="px-2 py-2 text-muted-foreground">
                        {item ? (
                          <span className="tabular-nums">
                            {formatDecimal(item.quantity)} {UNIT_LABEL[item.unit]}
                            {item.electricitySource && (
                              <span className="text-xs">
                                {' · '}
                                {ELECTRICITY_SOURCE_LABEL[item.electricitySource]}
                              </span>
                            )}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-2 py-2 text-xs text-muted-foreground">
                        <span className="font-mono">{line.emissionFactor.key}</span>
                        <br />
                        <span className="tabular-nums">
                          {formatDecimal(line.emissionFactor.value)} kg/
                          {UNIT_LABEL[line.emissionFactor.unit]}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-right font-medium tabular-nums">
                        {formatDecimal(line.emissionsKgCo2e)}
                      </td>
                      <td className="px-2 py-2">
                        <Badge variant="outline" className="text-xs">
                          <span
                            className={`mr-1 inline-block h-2 w-2 rounded-full ${SCOPE_COLOR[line.scope]}`}
                            aria-hidden
                          />
                          {line.scope.replace('_', ' ')}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t font-semibold">
                  <td colSpan={3} className="px-2 py-2 text-right">
                    Разом:
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums">
                    {formatDecimal(calculation.breakdown.totalKgCo2e)} kg CO₂e
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        ✅ Розрахунок збережено в БД (id: <span className="font-mono">{calculation.id}</span>),
        methodology v{calculation.methodologyVersion}. Перейдіть до кроку «Звіти», щоб
        експортувати результат, або{' '}
        <a
          href={`/calculations/${calculation.id}`}
          className="text-primary hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          відкрити повний детальний звіт
          <ArrowRight className="ml-0.5 inline h-3 w-3" />
        </a>
        .
      </p>
    </div>
  );
}

/**
 * Конвертує WizardFormData → PCFCalculationInput для POST.
 * Прибираємо порожні строки optional-полів та робимо trim'и.
 */
function toApiBody(data: WizardFormData): PCFCalculationInput {
  return {
    facilityName: data.facilityName.trim(),
    mode: data.mode,
    period: {
      startDate: data.period.startDate,
      endDate: data.period.endDate,
      label: data.period.label?.trim() || undefined,
    },
    notes: data.notes?.trim() || undefined,
    items: data.items.map((it) => ({
      id: it.id,
      materialId: it.materialId,
      category: it.category,
      // Branded типи у frontend нам не потрібні — backend валідує форму string'а.
      quantity: it.quantity as PCFCalculationInput['items'][number]['quantity'],
      unit: it.unit,
      electricitySource: it.electricitySource,
      notes: it.notes?.trim() || undefined,
    })),
    process: {
      outputMass:
        data.process.outputMass as PCFCalculationInput['process']['outputMass'],
      outputMassUnit: data.process.outputMassUnit,
      technologicalLossesPercent:
        (data.process.technologicalLossesPercent?.trim() ||
          undefined) as PCFCalculationInput['process']['technologicalLossesPercent'],
      productionLineName: data.process.productionLineName?.trim() || undefined,
    },
  };
}
