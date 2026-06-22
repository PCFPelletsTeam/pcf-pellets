import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Класічний shadcn-helper: об'єднує classNames + резолвить Tailwind-конфлікти.
 * Експортується саме звідси, бо `components.json` посилається на `@/lib/utils`.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
