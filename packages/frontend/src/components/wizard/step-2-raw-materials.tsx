import { MaterialCategory } from '@pcf/shared';
import { ItemsFieldArray } from './items-field-array';
import { RAW_MATERIAL_CATEGORIES } from './schema';

export function Step2RawMaterials() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Додайте сировину, що використовується у виробництві окатишів за обраний
        період: концентрат, бентоніт, флюси, добавки.
      </p>
      <ItemsFieldArray
        allowedCategories={RAW_MATERIAL_CATEGORIES}
        defaultCategoryOnAdd={MaterialCategory.IRON_ORE_CONCENTRATE}
        emptyTitle="Сировина ще не додана"
        emptyDescription="Натисніть «Додати», щоб додати перший матеріал."
      />
    </div>
  );
}
