// pages/api/healthz.js
// Hardened health check: never throws, never caches, always JSON for GET.
// HEAD/OPTIONS return 204 with no body.

module.exports = function handler(req, res) {
  try {
    // Never cache; allow probing from anywhere.
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Fast paths: HEAD/OPTIONS return 204 and end.
    if (req.method === 'HEAD' || req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }

    if (req.method !== 'GET') {
      res.status(405).json({ ok: false, error: 'Method not allowed' });
      return;
    }

    // Presence-only check; does NOT reveal secret values.
    const keysToCheck = [
      'DATABASE_URL',
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
      'ALLOW_DB_PING' // toggle for /api/db-ping
    ];

    const missing = keysToCheck.filter(
      (k) => !process.env[k] || String(process.env[k]).length === 0
    );

    const env = process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown';

    // Always 200 JSON for GET; "ok" reflects whether anything is missing.
    res.status(200).json({
      ok: missing.length === 0,
      env,
      missing,
      now: new Date().toISOString()
    });
  } catch (err) {
    // Last resort: still return JSON and avoid Next’s static 500 HTML.
    res.status(200).json({
      ok: false,
      env: process.env.VERCEL_ENV || process.env.NODE_ENV || 'unknown',
      missing: [],
      now: new Date().toISOString(),
      error: String((err && err.message) || err)
    });
  }
};
