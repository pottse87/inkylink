const { pool } = require("../../lib/db");

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
    // Light-weight round trip; also reveals ssl mode
    const q0 = Date.now();
    const r = await pool.query("select now() as now, current_setting('ssl') as ssl_mode;");
    out.timings_ms.query = Date.now() - q0;
    out.ok = true;
    out.result = r.rows[0];
    out.timings_ms.total = Date.now() - started;
    res.status(200).json(out);
  } catch (e) {
    out.error = e.message;
    out.code = e.code || null;
    out.detail = e.detail || null;
    out.hint = e.hint || null;
    out.routine = e.routine || null;
    out.timings_ms.total = Date.now() - started;
    res.status(500).json(out);
  }
};
