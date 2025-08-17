// pages/api/db-host.js — parse DB target only; no DB I/O

function setHeaders(res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("X-Content-Type-Options", "nosniff");
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

  res.status(200).json({
    ok: true,
    env: process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown",
    where: "api/db-host",
    db_target: parseDbUrl(process.env.DATABASE_URL)
  });
};

module.exports.config = { api: { bodyParser: true }, runtime: "nodejs" };
