import { MaterialCategory } from '@pcf/shared';
import { ItemsFieldArray } from './items-field-array';
import { ENERGY_CATEGORIES } from './schema';

export function Step3Energy() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Додайте енергоносії та паливо: природний газ, вугілля, кокс (як паливо), мазут,
        електроенергію (з обов'язковим вибором джерела), закуплене тепло.
      </p>
      <ItemsFieldArray
        allowedCategories={ENERGY_CATEGORIES}
        defaultCategoryOnAdd={MaterialCategory.NATURAL_GAS}
        emptyTitle="Енергоносії ще не додано"
        emptyDescription="Натисніть «Додати», щоб додати перший енергоносій."
      />
    </div>
  );
}
