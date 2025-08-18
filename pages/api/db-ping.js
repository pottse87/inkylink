// pages/api/db-ping.js
const { quickCheck } = require("../../lib/db");

function parseDbUrl(u) {
  try {
    const url = new URL(u);
    const userMasked = (url.username || "").replace(/./g, "*");
    return {
      host: url.hostname,
      port: url.port || null,
      database: url.pathname.replace(/^\//, "") || null,
      ssl: true, // we always force ssl in lib/db
      user_masked: userMasked,
    };
  } catch {
    return null;
  }
}

function noStore(res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
}

module.exports = async function handler(req, res) {
  noStore(res);

  // Allow fast HEAD to prove the route is alive without touching PG
  if (req.method === "HEAD") {
    res.status(204).end();
    return;
  }

  if (req.method !== "GET") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  if (process.env.ALLOW_DB_PING !== "true") {
    res.status(200).json({
      ok: false,
      disabled: true,
      reason: "Set ALLOW_DB_PING=true to enable this endpoint.",
    });
    return;
  }

  const started = Date.now();
  const out = {
    ok: false,
    where: "api/db-ping",
    env: process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown",
    summary: { db_target: parseDbUrl(process.env.DATABASE_URL) },
    timings_ms: {},
  };

  try {
    const q0 = Date.now();
    const r = await quickCheck();
    out.timings_ms.query = Date.now() - q0;
    out.ok = true;
    out.result = r;
  } catch (e) {
    // Return JSON **instead of** letting Next serve /500 HTML
    out.error = e?.message || String(e);
    out.code = e?.code || null;
    out.detail = e?.detail || null;
    out.hint = e?.hint || null;
    out.routine = e?.routine || null;
    out.stack = e?.stack ? String(e.stack).split("\n").slice(0, 6) : null;
  } finally {
    out.timings_ms.total = Date.now() - started;
    res.status(200).json(out);
  }
};
