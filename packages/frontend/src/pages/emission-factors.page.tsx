import { useQuery } from '@tanstack/react-query';
import { ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { ErrorMessage, Empty, Loading } from '@/components/common/loading';
import { PageHeader } from '@/components/common/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { emissionFactorsApi } from '@/lib/api';
import {
  CATEGORY_LABEL,
  ELECTRICITY_SOURCE_LABEL,
  formatDecimal,
  SCOPE_COLOR,
  SCOPE_LABEL,
  UNIT_LABEL,
} from '@/lib/format';
import type { GhgScope, MaterialCategory } from '@pcf/shared';

const ALL_CATEGORIES: MaterialCategory[] = [
  'IRON_ORE_CONCENTRATE',
  'BENTONITE',
  'LIMESTONE',
  'DOLOMITE',
  'COKE',
  'NATURAL_GAS',
  'COAL',
  'HEAVY_FUEL_OIL',
  'ELECTRICITY',
  'HEAT',
  'OTHER_ADDITIVE',
];

export default function EmissionFactorsPage() {
  const [category, setCategory] = useState<MaterialCategory | 'ALL'>('ALL');
  const [scope, setScope] = useState<GhgScope | 'ALL'>('ALL');

  const query = useQuery({
    queryKey: ['emission-factors', { category, scope }],
    queryFn: () =>
      emissionFactorsApi.list({
        category: category === 'ALL' ? undefined : category,
        scope: scope === 'ALL' ? undefined : scope,
        pageSize: 200,
      }),
  });

  return (
    <>
      <PageHeader
        title="EF довідник"
        description="Emission factors — read-only. Оновлюються через JSON-seed (data/emission-factors.seed.json) і повторний запуск seeder'а."
      />

      <div className="mb-4 flex gap-3">
        <Select value={category} onValueChange={(v) => setCategory(v as MaterialCategory | 'ALL')}>
          <SelectTrigger className="max-w-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Усі категорії</SelectItem>
            {ALL_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {CATEGORY_LABEL[c]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={scope} onValueChange={(v) => setScope(v as GhgScope | 'ALL')}>
          <SelectTrigger className="max-w-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Усі scope</SelectItem>
            <SelectItem value="SCOPE_1">{SCOPE_LABEL.SCOPE_1}</SelectItem>
            <SelectItem value="SCOPE_2">{SCOPE_LABEL.SCOPE_2}</SelectItem>
            <SelectItem value="SCOPE_3">{SCOPE_LABEL.SCOPE_3}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {query.isLoading && <Loading />}
      {query.error && <ErrorMessage error={query.error} />}
      {query.data && query.data.items.length === 0 && (
        <Empty title="Жодного EF не знайдено" description="Спробуйте змінити фільтри" />
      )}
      {query.data && query.data.items.length > 0 && (
        <div className="grid gap-3">
          {query.data.items.map((ef) => (
            <Card key={ef.id}>
              <CardContent className="pt-6">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-medium">{ef.name}</h3>
                    <p className="font-mono text-xs text-muted-foreground">{ef.key}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${SCOPE_COLOR[ef.scope]}`}
                      aria-hidden
                    />
                    <Badge variant="outline">{SCOPE_LABEL[ef.scope]}</Badge>
                  </div>
                </div>

                <div className="mb-3 flex items-baseline gap-2">
                  <span className="text-xl font-semibold tabular-nums">
                    {formatDecimal(ef.value)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    kg CO₂e / {UNIT_LABEL[ef.unit]}
                  </span>
                  {ef.uncertaintyPercent && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      U±{ef.uncertaintyPercent}%
                    </Badge>
                  )}
                </div>

                <div className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-3">
                  <div>
                    <span className="font-medium text-foreground">Категорія:</span>{' '}
                    {CATEGORY_LABEL[ef.category]}
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Регіон:</span> {ef.region}
                  </div>
                  <div>
                    <span className="font-medium text-foreground">Рік:</span> {ef.year}
                  </div>
                  {ef.electricitySource && (
                    <div>
                      <span className="font-medium text-foreground">Джерело ел.енергії:</span>{' '}
                      {ELECTRICITY_SOURCE_LABEL[ef.electricitySource]}
                    </div>
                  )}
                </div>

                <div className="mt-2 text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Джерело:</span> {ef.source}
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

                {ef.notes && (
                  <p className="mt-2 rounded bg-muted px-2 py-1.5 text-xs italic">
                    {ef.notes}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {query.data && (
        <p className="mt-4 text-xs text-muted-foreground">Всього: {query.data.total} EF</p>
      )}
    </>
  );
}
