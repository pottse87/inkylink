// pages/api/db-ping.js
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
      user_masked: user
    };
  } catch {
    return null;
  }
}

module.exports = async function handler(req, res) {
  // HEAD: quick health probe without body
  if (req.method === "HEAD") {
    res.status(204).setHeader("Cache-Control", "no-store").end();
    return;
  }
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
    timings_ms: {}
  };

  try {
    const t0 = Date.now();
    const pool = getPool(); // <- lazy (avoids import-time crash)
    const client = await pool.connect();
    out.timings_ms.connect = Date.now() - t0;

    try {
      const t1 = Date.now();
      // Use missing_ok=true so it never throws if the GUC isn't readable
      const r = await client.query(
        "select now() as now, current_setting('ssl', true) as ssl_mode"
      );
      out.timings_ms.query = Date.now() - t1;
      out.ok = true;
      out.result = r.rows[0];
    } finally {
      client.release();
    }

    out.timings_ms.total = Date.now() - started;
    res.status(200).json(out);
  } catch (e) {
    out.error = e?.message || String(e);
    out.code = e?.code || null;
    out.detail = e?.detail || null;
    out.hint = e?.hint || null;
    out.routine = e?.routine || null;
    out.stack = process.env.NODE_ENV === "development" ? e?.stack : undefined;
    out.timings_ms.total = Date.now() - started;
    res.status(500).json(out);
  }
};

// Force Node runtime (pg needs Node, not Edge)
module.exports.config = { runtime: "nodejs" };

