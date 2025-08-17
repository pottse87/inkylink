// pages/api/db-ping.js — resilient ping (returns JSON even if DB missing)
const { getPool } = require("../../lib/db");

function parseDbUrl(u) {
  try {
    const url = new URL(u);
    const user = (url.username || "").replace(/./g, "*");
    return {
      host: url.hostname,
      port: url.port,
      database: url.pathname.replace(/^\//, "") || null,
      ssl: true,
      user_masked: user,
    };
  } catch {
    return null;
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const started = Date.now();
  const out = {
    ok: false,
    env: process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown",
    where: "api/db-ping",
    summary: { db_target: parseDbUrl(process.env.DATABASE_URL) },
    timings_ms: {},
  };

  // Make sure we never cache diagnostics
  res.setHeader("Cache-Control", "no-store");

  // 1) Initialize pool (may throw if DATABASE_URL missing)
  let pool;
  try {
    const t0 = Date.now();
    pool = getPool();
    out.timings_ms.init = Date.now() - t0;
  } catch (e) {
    out.error = e.message;
    out.code = e.code || null;
    out.timings_ms.total = Date.now() - started;
    // Return 200 so you always see JSON instead of the HTML /500 page
    res.status(200).json(out);
    return;
  }

  // 2) Lightweight round trip; also reveals ssl mode
  try {
    const t1 = Date.now();
    const r = await pool.query(
      "select now() as now, coalesce(current_setting('ssl', true),'unknown') as ssl_mode;"
    );
    out.timings_ms.query = Date.now() - t1;
    out.ok = true;
    out.result = r.rows[0];
  } catch (e) {
    out.error = e.message;
    out.code = e.code || null;
    out.detail = e.detail || null;
    out.hint = e.hint || null;
    out.routine = e.routine || null;
  } finally {
    out.timings_ms.total = Date.now() - started;
    res.status(200).json(out);
  }
};

// Force Node runtime (not edge)
module.exports.config = { runtime: "nodejs" };
