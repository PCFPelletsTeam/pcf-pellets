/**
 * GHG Protocol scopes:
 * - Scope 1 — прямі викиди (спалювання палива, технологічні викиди).
 * - Scope 2 — непрямі енергетичні (закуплена електроенергія, тепло).
 * - Scope 3 — інші непрямі (видобуток сировини, транспорт, end-of-life).
 */
export const GhgScope = {
  SCOPE_1: 'SCOPE_1',
  SCOPE_2: 'SCOPE_2',
  SCOPE_3: 'SCOPE_3',
} as const;

export type GhgScope = (typeof GhgScope)[keyof typeof GhgScope];
