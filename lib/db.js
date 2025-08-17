// lib/db.js — hardened lazy Pool; safe to import anywhere

let _pool = null;

function getPool() {
  if (_pool) return _pool;

  // Defer requiring pg until invoked at runtime
  let Pool;
  try {
    ({ Pool } = require("pg"));
  } catch (e) {
    const err = new Error("The 'pg' package is not installed (require('pg') failed).");
    err.code = "PG_NOT_INSTALLED";
    err.cause = e;
    throw err;
  }

  const cs = process.env.DATABASE_URL;
  if (!cs) {
    const err = new Error("Missing DATABASE_URL");
    err.code = "NO_DATABASE_URL";
    throw err;
  }

  // Derive SSL from connection string
  let useSSL = true;
  try {
    const u = new URL(cs);
    const v = (u.searchParams.get("sslmode") || u.searchParams.get("ssl") || "").toLowerCase();
    if (v === "disable" || v === "off" || v === "0" || v === "false") useSSL = false;
  } catch {
    // keep default true
  }

  _pool = new Pool({
    connectionString: cs,
    ssl: useSSL ? { rejectUnauthorized: false } : false,
    max: Number(process.env.PG_POOL_MAX || 5),
    idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS || 10_000),
    connectionTimeoutMillis: Number(process.env.PG_CONN_TIMEOUT_MS || 8_000),
    keepAlive: true
  });

  _pool.on("error", (err) => {
    console.error("[pg] idle client error:", err?.message || err);
  });

  return _pool;
}

// Back-compat proxy for `pool.query(...)`
const pool = new Proxy({}, {
  get(_t, prop) {
    const p = getPool();
    return p[prop];
  }
});

module.exports = { getPool, pool };
