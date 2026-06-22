import { useFormContext } from 'react-hook-form';
import { Unit } from '@pcf/shared';
import {
  FormControl,
  FormDescription,
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
import { UNIT_LABEL } from '@/lib/format';
import type { WizardFormData } from './schema';

const MASS_UNITS = [Unit.KG, Unit.TONNE];

export function Step4Process() {
  const form = useFormContext<WizardFormData>();

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Параметри процесу впливають на знаменник PCF:{' '}
        <span className="font-mono">PCF = total emissions / output mass</span>.
      </p>

      <div className="grid gap-4 sm:grid-cols-3">
        <FormField
          control={form.control}
          name="process.outputMass"
          render={({ field }) => (
            <FormItem className="sm:col-span-2">
              <FormLabel>Маса виробленого продукту</FormLabel>
              <FormControl>
                <Input inputMode="decimal" placeholder="100000" {...field} />
              </FormControl>
              <FormDescription>За весь обраний звітний період.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="process.outputMassUnit"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Одиниця</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {MASS_UNITS.map((u) => (
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
      </div>

      <FormField
        control={form.control}
        name="process.technologicalLossesPercent"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Технологічні втрати, % (опц.)</FormLabel>
            <FormControl>
              <Input inputMode="decimal" placeholder="0.5" {...field} />
            </FormControl>
            <FormDescription>
              Лише для анотації звіту, не впливає на формулу PCF.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="process.productionLineName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Назва лінії випалу (опц.)</FormLabel>
            <FormControl>
              <Input placeholder="Лінія №2, обпалювальна машина OK-360" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
