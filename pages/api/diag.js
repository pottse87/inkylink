function mask(v) {
  if (!v) return null;
  const s = String(v);
  if (s.length <= 6) return "***";
  return s.slice(0, 2) + "***" + s.slice(-2);
}

export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  const envName = process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown";
  const allowPing = (process.env.ALLOW_DB_PING || "").toLowerCase();
  const maskedEnv = {
    DATABASE_URL: mask(process.env.DATABASE_URL),
    STRIPE_SECRET_KEY: mask(process.env.STRIPE_SECRET_KEY),
    STRIPE_WEBHOOK_SECRET: mask(process.env.STRIPE_WEBHOOK_SECRET),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: mask(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
    ALLOW_DB_PING: allowPing, // unmasked boolean-ish flag is fine
  };

  res.status(200).json({
    ok: true,
    route: "/api/diag",
    env: envName,
    node: process.version,
    allow_db_ping_effective: (allowPing === "1" || allowPing === "true" || allowPing === "yes"),
    masked_env: maskedEnv,
    now: new Date().toISOString(),
  });
}
