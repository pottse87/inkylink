// pages/api/db-ping.js
// Hardened ping endpoint.
// - HEAD -> 204 No Content (with no-store)
// - GET  -> Always JSON (success or detailed JSON error)
// - Never falls back to Next.js static /500 page

const { getPool } = require("../../lib/db");

function parseDbUrl(u) {
  try {
    const url = new URL(u);
    const user = url.username || "";
    return {
      host: url.hostname,
      port: url.port || null,
      database: (url.pathname || "").replace(/^\//, "") || null,
      ssl: true,
      user_masked: user ? user.replace(/./g, "*") : "",
    };
  } catch {
    return null;
  }
}

function truthy(v) {
  if (!v) return false;
  const s = String(v).trim().toLowerCase();
  return s === "1" || s === "true" || s === "yes" || s === "y" || s === "on";
}

module.exports = async function handler(req, res) {
  // Do not cache this route
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex");

  if (req.method === "HEAD") {
    res.status(204).end();
    return;
  }

  if (req.method !== "GET") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  // Optional safety gate: set in Vercel → ALLOW_DB_PING = 1
  if (!truthy(process.env.ALLOW_DB_PING)) {
    res.status(403).json({
      ok: false,
      error:
        "DB ping disabled. Set ALLOW_DB_PING=1 in Vercel (Production) to enable.",
    });
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

  try {
    const pool = getPool();
    if (!pool) {
      out.error = "Missing DATABASE_URL or 'pg' module unavailable";
      out.timings_ms.total = Date.now() - started;
      res.status(500).json(out);
      return;
    }

    const t0 = Date.now();
    let row;
    try {
      // Try to read ssl mode (may not be exposed on some managed PGs)
      const r = await pool.query(
        "select now() as now, current_setting('ssl', true) as ssl_mode;"
      );
      row = r.rows[0];
    } catch {
      // Fallback: just get time
      const r = await pool.query("select now() as now;");
      row = r.rows[0];
      row.ssl_mode = null;
    }

    out.timings_ms.query = Date.now() - t0;
    out.ok = true;
    out.result = row;
    out.timings_ms.total = Date.now() - started;
    res.status(200).json(out);
  } catch (e) {
    out.error = e && e.message ? e.message : String(e);
    out.code = e && e.code ? e.code : null;
    out.detail = e && e.detail ? e.detail : null;
    out.hint = e && e.hint ? e.hint : null;
    out.routine = e && e.routine ? e.routine : null;
    out.timings_ms.total = Date.now() - started;
    // Critical: always return JSON so Next.js does NOT render static /500
    res.status(500).json(out);
  }
};
