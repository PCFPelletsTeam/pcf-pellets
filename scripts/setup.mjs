#!/usr/bin/env node
/**
 * Інтерактивний setup-скрипт для першого запуску PCF Pellets.
 *
 * Робить (idempotent — кожен крок безпечно повторювати):
 *   1. Перевіряє Node.js ≥ 22.20
 *   2. Якщо node_modules відсутні — `npm install`
 *   3. Якщо `.env.local` відсутній у backend — копіює з `.env.example`
 *   4. Збирає `@pcf/shared` (потрібен як runtime dep для backend)
 *   5. Прокатує всі pending міграції
 *   6. Друкує наступний крок (`npm run dev`)
 */
import { execSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

function log(label, msg, color = colors.cyan) {
  process.stdout.write(`${color}${colors.bold}[${label}]${colors.reset} ${msg}\n`);
}

function ok(msg) {
  log('OK', msg, colors.green);
}

function warn(msg) {
  log('WARN', msg, colors.yellow);
}

function step(n, total, msg) {
  log(`${n}/${total}`, msg, colors.cyan);
}

function run(cmd, opts = {}) {
  execSync(cmd, { stdio: 'inherit', cwd: ROOT, ...opts });
}

// --- 1. Node version ---
step(1, 5, 'Перевірка Node.js версії');
const nodeMajor = parseInt(process.versions.node.split('.')[0], 10);
const nodeMinor = parseInt(process.versions.node.split('.')[1], 10);
if (nodeMajor < 22 || (nodeMajor === 22 && nodeMinor < 20)) {
  log(
    'ERROR',
    `Node ${process.versions.node} < 22.20.0. Оновіть Node.js (див. .nvmrc).`,
    colors.red,
  );
  process.exit(1);
}
ok(`Node ${process.versions.node}`);

// --- 2. npm install ---
step(2, 5, 'Перевірка npm install');
if (!existsSync(join(ROOT, 'node_modules', '.package-lock.json'))) {
  log('RUN', 'npm install (це може зайняти кілька хвилин)…');
  run('npm install');
} else {
  ok('node_modules існує — пропускаю');
}

// --- 3. .env.local ---
step(3, 5, 'Перевірка backend/.env.local');
const envExample = join(ROOT, 'packages', 'backend', '.env.example');
const envLocal = join(ROOT, 'packages', 'backend', '.env.local');
if (!existsSync(envLocal)) {
  copyFileSync(envExample, envLocal);
  ok('Скопійовано .env.example → .env.local');
} else {
  ok('.env.local існує — пропускаю');
}

// --- 3.5. storage директорії ---
const storageDir = join(ROOT, 'packages', 'backend', 'storage');
const reportsDir = join(storageDir, 'reports');
if (!existsSync(storageDir)) mkdirSync(storageDir, { recursive: true });
if (!existsSync(reportsDir)) mkdirSync(reportsDir, { recursive: true });

// --- 4. Build shared ---
step(4, 5, 'Збираю @pcf/shared (потрібен як runtime для backend)');
run('npm run build:shared');
ok('@pcf/shared зібрано');

// --- 5. Migrations ---
step(5, 5, 'Прокатую міграції БД');
try {
  run('npm run migration:run');
  ok('Міграції застосовано');
} catch (err) {
  warn('Міграції впали. Це може бути нормально якщо вже застосовані.');
  warn(`Деталі: ${err instanceof Error ? err.message : String(err)}`);
}

// --- Done ---
process.stdout.write('\n');
log('DONE', 'Setup завершено!', colors.green);
process.stdout.write('\n');
process.stdout.write(`${colors.bold}Що далі:${colors.reset}\n`);
process.stdout.write(`  ${colors.cyan}npm run dev${colors.reset}              ${colors.yellow}# backend + frontend паралельно${colors.reset}\n`);
process.stdout.write(`  ${colors.cyan}npm run dev:backend${colors.reset}      ${colors.yellow}# тільки NestJS API${colors.reset}\n`);
process.stdout.write(`  ${colors.cyan}npm run dev:frontend${colors.reset}     ${colors.yellow}# тільки Vite${colors.reset}\n`);
process.stdout.write('\n');
process.stdout.write(`${colors.bold}URL після dev:${colors.reset}\n`);
process.stdout.write(`  Frontend  : http://localhost:5173\n`);
process.stdout.write(`  API + UI  : http://localhost:3000/api/docs (Swagger)\n`);
process.stdout.write(`  Health    : http://localhost:3000/api/v1/health\n`);
process.stdout.write('\n');
