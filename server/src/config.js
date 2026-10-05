import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env from cwd, server folder, then fallback to repo root .env
dotenv.config();
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../../.env') });

const DEFAULT_JWT_SECRET = 'linguavault_secure_jwt_local_secret_2026_super_key';
const DEFAULT_ADMIN_PASSWORD = '123456';

const bool = (value, fallback) => {
  if (value === undefined || value === '') return fallback;
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
};

const int = (value, fallback) => {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
};

const list = (value) =>
  String(value || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

const env = process.env.NODE_ENV || 'development';
const isProduction = env === 'production';
const isTest = env === 'test';

export const config = {
  env,
  isProduction,
  isTest,
  port: int(process.env.PORT, 5001),

  dbPath: process.env.DB_PATH || path.join(__dirname, '../data/lingua_vault.db'),

  jwtSecret: process.env.JWT_SECRET || DEFAULT_JWT_SECRET,
  tokenExpiryDays: int(process.env.TOKEN_EXPIRY_DAYS, 7),

  // Empty list => reflect any origin (needed for LAN device testing).
  corsOrigins: list(process.env.CORS_ORIGINS),

  // Password used only when seeding the very first admin account.
  adminDefaultPassword: process.env.ADMIN_DEFAULT_PASSWORD || DEFAULT_ADMIN_PASSWORD,

  // Unauthenticated client crash/breadcrumb endpoints. Useful on a LAN, a
  // liability on a public host, so they are off by default in production.
  debugLogsEnabled: bool(process.env.DEBUG_LOGS_ENABLED, !isProduction),

  // Background workers are skipped under test so the suite exits cleanly.
  schedulersEnabled: bool(process.env.SCHEDULERS_ENABLED, !isTest),

  rateLimit: {
    authMax: int(process.env.RATE_LIMIT_AUTH_MAX, 10),
    authWindowMs: int(process.env.RATE_LIMIT_AUTH_WINDOW_MS, 60_000),
    apiMax: int(process.env.RATE_LIMIT_API_MAX, 600),
    apiWindowMs: int(process.env.RATE_LIMIT_API_WINDOW_MS, 60_000)
  }
};

/**
 * Fail fast on insecure defaults in production; warn about them elsewhere.
 * Returns the list of problems so callers can log or assert on them.
 */
export function auditConfig({ throwOnError = false } = {}) {
  const problems = [];

  if (config.jwtSecret === DEFAULT_JWT_SECRET) {
    problems.push('JWT_SECRET is the built-in development value; anyone can forge tokens.');
  }
  if (config.jwtSecret.length < 32) {
    problems.push('JWT_SECRET is shorter than 32 characters.');
  }
  if (config.adminDefaultPassword === DEFAULT_ADMIN_PASSWORD) {
    problems.push('ADMIN_DEFAULT_PASSWORD is the built-in "123456"; set it before seeding a public instance.');
  }
  if (config.isProduction && config.corsOrigins.length === 0) {
    problems.push('CORS_ORIGINS is empty, so every origin is reflected.');
  }
  if (config.isProduction && config.debugLogsEnabled) {
    problems.push('DEBUG_LOGS_ENABLED is on in production; client log endpoints are unauthenticated.');
  }

  if (problems.length && throwOnError) {
    throw new Error(`Refusing to start with insecure configuration:\n  - ${problems.join('\n  - ')}`);
  }
  return problems;
}

export const ADMIN_USER_ID = 'admin_master_user_id';
export const GUEST_USER_ID = 'guest_demo_user_id';
