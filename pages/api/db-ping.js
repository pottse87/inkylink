"use strict";
exports.config = { runtime: "nodejs" };

const { getPool } = require("../../lib/db");

function parseDbUrl(u) {
  try {
    const s = String(u || "").replace(/\r?\n/g, "").trim();
    const url = new URL(s);
    const userMasked = (url.username || "").replace(/./g, "*");
    return {
      host: url.hostname,
      port: url.port || null,
      database: url.pathname.replace(/^\//, "") || null,
      ssl: true,
      user_masked: userMasked,
    };
  } catch {
    return null;
  }
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  try {
    if (req.method === "HEAD") {
      res.status(204).end();
      return;
    }
    if (req.method !== "GET") {
      res.status(405).end(JSON.stringify({ error: "Method not allowed" }));
      return;
    }

    const started = Date.now();
    const allow = String(process.env.ALLOW_DB_PING || "").trim().toLowerCase();
    const out = {
      ok: false,
      env: process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown",
      where: "api/db-ping",
      summary: { db_target: parseDbUrl(process.env.DATABASE_URL) },
      timings_ms: {},
    };

    if (!(allow === "1" || allow === "true" || allow === "yes")) {
      out.error = "db-ping disabled by ALLOW_DB_PING";
      out.timings_ms.total = Date.now() - started;
      res.status(403).end(JSON.stringify(out));
      return;
    }

    const pool = getPool();
    const t0 = Date.now();
    const r = await pool.query("select now() as now, current_setting('ssl') as ssl_mode;");
    out.timings_ms.query = Date.now() - t0;
    out.ok = true;
    out.result = r.rows[0];
    out.timings_ms.total = Date.now() - started;
    res.status(200).end(JSON.stringify(out));
  } catch (e) {
    const errOut = {
      ok: false,
      env: process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown",
      where: "api/db-ping",
      error: e?.message || String(e),
      code: e?.code || null,
      detail: e?.detail || null,
      hint: e?.hint || null,
      routine: e?.routine || null,
    };
    try { res.status(500).end(JSON.stringify(errOut)); } catch {}
  }
};
