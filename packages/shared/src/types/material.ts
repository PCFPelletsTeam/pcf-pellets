import type { MaterialCategory } from '../enums/material-category';
import type { Unit } from '../enums/unit';

/**
 * Довідник матеріалів і енергоносіїв (master data).
 * Запис в БД, що описує "що це таке". Конкретна кількість і EF — вже у `MaterialInput`.
 */
export interface Material {
  /** UUID. */
  id: string;
  /** Людська назва ("Магнетитовий концентрат ПГЗК", "Природний газ"). */
  name: string;
  /** Категорія — ключ для фільтрації EF. */
  category: MaterialCategory;
  /** Одиниця за замовчуванням, у якій інженер вводить кількість. */
  defaultUnit: Unit;
  /** Опціональний опис / технічні характеристики. */
  description?: string;
  /** ISO timestamp створення запису. */
  createdAt: string;
  /** ISO timestamp останнього оновлення. */
  updatedAt: string;
}
