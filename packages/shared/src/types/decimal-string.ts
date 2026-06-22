/**
 * Branded-string для значень довільної точності.
 *
 * Усі PCF-обчислення робляться через `decimal.js` у backend, але по дроту
 * (JSON / SQLite TEXT) число передається як string, щоб уникнути втрати точності
 * від `Number` (IEEE 754). Перетворення `string ⇄ Decimal` виконується тільки
 * у calculation engine.
 *
 * Тип навмисно brand'ується, щоб випадковий `"abc"` не зайшов як emission value.
 */
export type DecimalString = string & { readonly __brand: 'DecimalString' };

/**
 * Конструктор з валідацією — використовувати на межі (DTO, контролер).
 * Кидає `RangeError`, якщо рядок не парситься як скінченне число.
 *
 * Не покладайся лише на цю функцію для критичних значень — у backend завжди
 * перевіряй через `new Decimal(value)` ще раз перед обчисленням.
 */
export function toDecimalString(value: string | number): DecimalString {
  const s = typeof value === 'number' ? value.toString() : value.trim();
  if (!/^-?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(s)) {
    throw new RangeError(`Невалідне числове значення: "${value}"`);
  }
  return s as DecimalString;
}

export function isDecimalString(value: unknown): value is DecimalString {
  return typeof value === 'string' && /^-?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(value);
}
