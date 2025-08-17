// pages/api/db-ping.js — DB round-trip with strict JSON and no-store

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

async function handler(req, res) {
  setHeaders(res);

  if (req.method === "HEAD") {
    res.status(204).end();
    return;
  }
  if (req.method !== "GET") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
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

  let getPool;
  try {
    ({ getPool } = require("../../lib/db"));
  } catch (e) {
    out.error = "Failed to load DB module";
    out.code = e.code || null;
    out.detail = e.message || String(e);
    out.timings_ms.total = Date.now() - started;
    res.status(200).json(out);
    return;
  }

  try {
    const pool = getPool();
    const t0 = Date.now();

    // Use missing_ok=true to avoid exceptions if the GUC is absent
    const r = await pool.query("select now() as now, current_setting('ssl', true) as ssl_mode;");
    out.timings_ms.query = Date.now() - t0;

    out.ok = true;
    out.result = r.rows[0] || null;
    out.timings_ms.total = Date.now() - started;
    res.status(200).json(out);
  } catch (e) {
    out.error = e.message || String(e);
    out.code = e.code || null;
    out.detail = e.detail || null;
    out.hint = e.hint || null;
    out.routine = e.routine || null;
    out.timings_ms.total = Date.now() - started;
    res.status(200).json(out); // never emit HTML 500
  }
}

module.exports = handler;
module.exports.config = { api: { bodyParser: true }, runtime: "nodejs" };
