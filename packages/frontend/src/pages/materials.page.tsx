import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ErrorMessage, Empty, Loading } from '@/components/common/loading';
import { PageHeader } from '@/components/common/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { materialsApi } from '@/lib/api';
import { CATEGORY_LABEL, UNIT_LABEL } from '@/lib/format';
import type { MaterialCategory } from '@pcf/shared';

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

export default function MaterialsPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<MaterialCategory | 'ALL'>('ALL');

  const query = useQuery({
    queryKey: ['materials', { search, category }],
    queryFn: () =>
      materialsApi.list({
        search: search || undefined,
        category: category === 'ALL' ? undefined : category,
        pageSize: 100,
      }),
  });

  return (
    <>
      <PageHeader
        title="Довідник матеріалів"
        description="Master data — список матеріалів і енергоносіїв, що використовуються у розрахунках"
      />

      <div className="mb-4 flex gap-3">
        <Input
          placeholder="Пошук за назвою…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
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
      </div>

      {query.isLoading && <Loading />}
      {query.error && <ErrorMessage error={query.error} />}
      {query.data && query.data.items.length === 0 && (
        <Empty title="Нічого не знайдено" description="Спробуйте змінити фільтри" />
      )}
      {query.data && query.data.items.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2">
          {query.data.items.map((mat) => (
            <Card key={mat.id}>
              <CardContent className="pt-6">
                <div className="mb-2 flex items-start justify-between gap-2">
                  <h3 className="font-medium">{mat.name}</h3>
                  <Badge variant="secondary" className="shrink-0 text-xs">
                    {UNIT_LABEL[mat.defaultUnit]}
                  </Badge>
                </div>
                <p className="mb-2 text-xs text-muted-foreground">
                  {CATEGORY_LABEL[mat.category]}
                </p>
                {mat.description && (
                  <p className="text-sm text-muted-foreground">{mat.description}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {query.data && (
        <p className="mt-4 text-xs text-muted-foreground">
          Всього: {query.data.total} матеріал(ів)
        </p>
      )}
    </>
  );
}
