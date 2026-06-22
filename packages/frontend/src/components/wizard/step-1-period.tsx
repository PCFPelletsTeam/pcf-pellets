import { useFormContext } from 'react-hook-form';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import type { WizardFormData } from './schema';

export function Step1Period() {
  const form = useFormContext<WizardFormData>();

  return (
    <div className="space-y-6">
      <FormField
        control={form.control}
        name="facilityName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Назва підприємства / установки</FormLabel>
            <FormControl>
              <Input placeholder="Наприклад: Полтавський ГЗК, фабрика окатишів №2" {...field} />
            </FormControl>
            <FormDescription>
              Буде використано у заголовку розрахунку та звітах.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="mode"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel>Режим розрахунку</FormLabel>
            <FormControl>
              <RadioGroup
                value={field.value}
                onValueChange={field.onChange}
                className="grid gap-3 sm:grid-cols-2"
              >
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                  <RadioGroupItem value="ISO_14067" className="mt-0.5" />
                  <div>
                    <p className="font-medium">ISO 14067</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Повний CFP за ISO 14067:2018: Scope 1 + 2 + 3 (cradle-to-gate).
                    </p>
                  </div>
                </label>
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                  <RadioGroupItem value="CBAM" className="mt-0.5" />
                  <div>
                    <p className="font-medium">CBAM</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Спрощений варіант для CBAM-звіту: тільки Scope 1 + 2.
                    </p>
                  </div>
                </label>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <FormField
          control={form.control}
          name="period.startDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Початок періоду</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="period.endDate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Кінець періоду</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="period.label"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Підпис періоду (опц.)</FormLabel>
              <FormControl>
                <Input placeholder="Q1 2026" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="notes"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Загальні нотатки (опц.)</FormLabel>
            <FormControl>
              <Textarea rows={3} placeholder="Будь-які коментарі еколога…" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
