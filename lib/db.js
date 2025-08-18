// lib/db.js
let _pool = null;
let _poolCreating = false;

function getPool() {
  if (_pool) return _pool;
  if (_poolCreating) {
    // Prevent re-entrancy during cold start
    throw new Error("PG pool is initializing; retry shortly.");
  }

  const { Pool } = require("pg");
  const cs = process.env.DATABASE_URL;
  if (!cs) throw new Error("Missing env DATABASE_URL");

  _poolCreating = true;
  try {
    _pool = new Pool({
      connectionString: cs,
      // Supabase/pooler expects TLS. Self-signed CA is common: don't reject.
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 8_000,
      keepAlive: true,
    });

    // Log unexpected idle-client errors (doesn't crash the process)
    _pool.on("error", (err) => {
      console.error("[pg] idle client error:", err?.message || err);
    });

    return _pool;
  } finally {
    _poolCreating = false;
  }
}

// Small, safe round-trip that also exposes TLS mode from Postgres
async function quickCheck() {
  const pool = getPool();
  const sql = "select now() as now, current_setting('ssl') as ssl_mode;";
  const res = await pool.query(sql);
  return res.rows[0];
}

module.exports = { getPool, quickCheck };
