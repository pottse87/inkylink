export default function handler(req, res) {
  const keys = [
    "DATABASE_URL",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
  ];
  const missing = keys.filter(k => !process.env[k]);
  const env = process.env.VERCEL_ENV || process.env.NODE_ENV || "development"; res.status(missing.length ? 500 : 200).json({ env,
    ok: missing.length === 0,
    missing,
    now: new Date().toISOString()
  });
}