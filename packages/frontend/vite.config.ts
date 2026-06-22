import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // @pcf/shared скомпільований як CommonJS (бо backend/Nest його споживає як CJS).
  // Workspace deps Vite за замовчуванням НЕ оптимізує — і ланцюг `__exportStar`
  // не дає esbuild статично виявити named exports на льоту → у браузері з'являється
  // SyntaxError "does not provide an export named ...". Тому форсуємо pre-bundle:
  // esbuild згладжує CJS→ESM, named exports стають доступні.
  optimizeDeps: {
    include: ['@pcf/shared'],
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      // усі запити на /api проксяться на NestJS (порт 3000)
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
