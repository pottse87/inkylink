const required = [
  'DATABASE_URL',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'NEXT_PUBLIC_SITE_URL',
];
const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1' || process.env.CI === 'true';
if (!isProd) { console.log('[verify-env] Non-production build; skipping strict checks.'); process.exit(0); }
const missing = required.filter(k => !process.env[k] || String(process.env[k]).trim() === '');
if (missing.length) {
  console.error('\\n❌ Missing required env vars for PRODUCTION build:');
  for (const k of missing) console.error(' - ' + k);
  console.error('\\nAdd them in Vercel Project Settings and .env.local, then rebuild.');
  process.exit(1);
}
console.log('[verify-env] OK');
