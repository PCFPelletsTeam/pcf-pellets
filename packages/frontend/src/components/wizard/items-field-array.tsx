import { Plus, Trash2 } from 'lucide-react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { ElectricitySource, MaterialCategory, Unit } from '@pcf/shared';
import { Empty } from '@/components/common/loading';
import { Button } from '@/components/ui/button';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CATEGORY_LABEL,
  ELECTRICITY_SOURCE_LABEL,
  UNIT_LABEL,
} from '@/lib/format';
import { DEFAULT_UNIT_BY_CATEGORY, type WizardFormData } from './schema';

interface ItemsFieldArrayProps {
  /** Категорії, які доступні для додавання на цьому кроці. */
  allowedCategories: readonly MaterialCategory[];
  /** Категорії за замовчуванням при кліку "Додати". */
  defaultCategoryOnAdd: MaterialCategory;
  /** Текст пустого стану. */
  emptyTitle: string;
  emptyDescription: string;
}

const ALL_UNITS = Object.values(Unit);

/**
 * Спільний компонент для steps 2 (Raw Materials) і 3 (Energy).
 * Items[] — одна спільна array у формі. Цей компонент:
 *   - показує тільки items, чий category ∈ allowedCategories,
 *   - дозволяє додавати тільки items з allowedCategories,
 *   - при category=ELECTRICITY автоматично вимагає electricitySource (selector).
 */
export function ItemsFieldArray({
  allowedCategories,
  defaultCategoryOnAdd,
  emptyTitle,
  emptyDescription,
}: ItemsFieldArrayProps) {
  const form = useFormContext<WizardFormData>();
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });
  const allItems = useWatch({ control: form.control, name: 'items' });

  // Відображаємо тільки items, що належать до цього кроку.
  const visibleIndexes = fields
    .map((_, idx) => idx)
    .filter((idx) => {
      const cat = allItems?.[idx]?.category;
      return cat !== undefined && allowedCategories.includes(cat);
    });

  const handleAdd = () => {
    append({
      id: crypto.randomUUID(),
      materialId: crypto.randomUUID(),
      category: defaultCategoryOnAdd,
      quantity: '',
      unit: DEFAULT_UNIT_BY_CATEGORY[defaultCategoryOnAdd],
      electricitySource:
        defaultCategoryOnAdd === MaterialCategory.ELECTRICITY
          ? ElectricitySource.UA_GRID_AVG
          : undefined,
      notes: '',
    });
  };

  return (
    <div className="space-y-4">
      {visibleIndexes.length === 0 ? (
        <Empty
          title={emptyTitle}
          description={emptyDescription}
          action={
            <Button type="button" onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" /> Додати
            </Button>
          }
        />
      ) : (
        <>
          {visibleIndexes.map((idx) => (
            <ItemRow
              key={fields[idx]!.id}
              idx={idx}
              allowedCategories={allowedCategories}
              onRemove={() => remove(idx)}
            />
          ))}
          <Button type="button" variant="outline" onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" /> Додати ще
          </Button>
        </>
      )}
    </div>
  );
}

interface ItemRowProps {
  idx: number;
  allowedCategories: readonly MaterialCategory[];
  onRemove: () => void;
}

function ItemRow({ idx, allowedCategories, onRemove }: ItemRowProps) {
  const form = useFormContext<WizardFormData>();
  const category = useWatch({ control: form.control, name: `items.${idx}.category` });
  const isElectricity = category === MaterialCategory.ELECTRICITY;

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="grid gap-3 md:grid-cols-12">
        <FormField
          control={form.control}
          name={`items.${idx}.category`}
          render={({ field }) => (
            <FormItem className="md:col-span-4">
              <FormLabel className="text-xs">Категорія</FormLabel>
              <Select
                value={field.value}
                onValueChange={(v) => {
                  field.onChange(v);
                  // При зміні категорії — автокорекція unit і electricitySource.
                  const cat = v as MaterialCategory;
                  form.setValue(`items.${idx}.unit`, DEFAULT_UNIT_BY_CATEGORY[cat]);
                  form.setValue(
                    `items.${idx}.electricitySource`,
                    cat === MaterialCategory.ELECTRICITY
                      ? ElectricitySource.UA_GRID_AVG
                      : undefined,
                  );
                }}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {allowedCategories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {CATEGORY_LABEL[c]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`items.${idx}.quantity`}
          render={({ field }) => (
            <FormItem className="md:col-span-3">
              <FormLabel className="text-xs">Кількість</FormLabel>
              <FormControl>
                <Input inputMode="decimal" placeholder="0" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name={`items.${idx}.unit`}
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel className="text-xs">Одиниця</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {ALL_UNITS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {UNIT_LABEL[u]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-end justify-end md:col-span-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="mr-1 h-4 w-4" /> Видалити
          </Button>
        </div>

        {isElectricity && (
          <FormField
            control={form.control}
            name={`items.${idx}.electricitySource`}
            render={({ field }) => (
              <FormItem className="md:col-span-12">
                <FormLabel className="text-xs">Джерело електроенергії</FormLabel>
                <Select value={field.value ?? ''} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Оберіть джерело…" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.entries(ELECTRICITY_SOURCE_LABEL).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>
    </div>
  );
}
