import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import globals from 'globals';

/**
 * Frontend ESLint config (flat).
 *
 * Прибрали `js.configs.recommended` — у поточній комбінації @eslint/js@9.18 +
 * eslint@9.39 він повертає undefined у flat-config'у. typescript-eslint 8.x
 * вже включає еквівалентні JS-правила, тож дублювати немає сенсу.
 */
export default tseslint.config(
  { ignores: ['dist', 'node_modules', 'public', 'vite.config.ts'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [...tseslint.configs.recommended],
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.es2022 },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // shadcn-компоненти експортують variants/hooks поряд з React-компонентами —
      // це їхній офіційний патерн. Вимикаємо HMR-warning для них (non-critical).
      'react-refresh/only-export-components': 'off',
      // Дозволяємо `_unused` префікс — використовуємо у void-параметрах для locale.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
);
