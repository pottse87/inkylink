// pages/api/env-inspect.js — presence/sanitized env; no secrets leaked

function setHeaders(res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("X-Content-Type-Options", "nosniff");
}

function mask(v, keep = 4) {
  if (!v) return null;
  const s = String(v);
  if (s.length <= keep) return "*".repeat(s.length);
  return `${s.slice(0, keep)}${"*".repeat(Math.max(0, s.length - keep))}`;
}

function sslFromUrl(u) {
  try {
    const url = new URL(u);
    const v = (url.searchParams.get("sslmode") || url.searchParams.get("ssl") || "").toLowerCase();
    return !(v === "disable" || v === "off" || v === "0" || v === "false");
  } catch {
    return true;
  }
}

function parseDbUrl(u) {
  try {
    const url = new URL(u);
    const user = (url.username || "").replace(/./g, "*");
    return {
      host: url.hostname,
      port: url.port || null,
      database: url.pathname.replace(/^\//, "") || null,
      ssl: sslFromUrl(u),
      user_masked: user
    };
  } catch {
    return null;
  }
}

module.exports = function handler(req, res) {
  setHeaders(res);

  if (req.method === "HEAD") {
    res.status(204).end();
    return;
  }
  if (req.method !== "GET") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  const keys = [
    "NODE_ENV",
    "VERCEL_ENV",
    "DATABASE_URL",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET"
  ];

  const presence = {};
  for (const k of keys) presence[k] = Boolean(process.env[k]);

  res.status(200).json({
    ok: true,
    env: {
      NODE_ENV: process.env.NODE_ENV || null,
      VERCEL_ENV: process.env.VERCEL_ENV || null
    },
    presence,
    preview: {
      DATABASE_URL: parseDbUrl(process.env.DATABASE_URL),
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? mask(process.env.STRIPE_SECRET_KEY) : null,
      STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ? mask(process.env.STRIPE_WEBHOOK_SECRET) : null
    }
  });
};

module.exports.config = { api: { bodyParser: true }, runtime: "nodejs" };




