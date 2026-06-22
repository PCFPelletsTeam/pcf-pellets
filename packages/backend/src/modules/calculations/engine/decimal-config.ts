import { Decimal } from 'decimal.js';

/**
 * Глобальна конфігурація `decimal.js` для PCF-обчислень.
 *
 * - `precision: 30` — більше ніж достатньо: типові EF мають 2–4 значущі цифри,
 *   квантові (output mass) — 5–6, проміжний добуток ≈ 10. 30 покриває з запасом.
 * - `ROUND_HALF_UP` — стандартний "шкільний" half-up; так округляється і CBAM
 *   тестова форма (banker's rounding не використовується для emissions).
 *
 * Імпортувати **один раз** на верхньому рівні (engine/index.ts або module),
 * щоб side-effect застосувався до глобального `Decimal`.
 */
Decimal.set({
  precision: 30,
  rounding: Decimal.ROUND_HALF_UP,
  toExpPos: 60,
  toExpNeg: -30,
});

export const PCF_DECIMAL_PRECISION = 30;
