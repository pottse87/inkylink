// lib/db.js — lazy Pool so API routes don't crash at import time
let _pool = null;

function getPool() {
  if (_pool) return _pool;
  const { Pool } = require("pg");

  const cs = process.env.DATABASE_URL;
  if (!cs) {
    const err = new Error("Missing DATABASE_URL");
    err.code = "NO_DATABASE_URL";
    throw err;
  }

  // Default to SSL unless explicitly disabled in the URL.
  // rejectUnauthorized:false covers Supabase pooler/self-signed CA.
  const ssl =
    /sslmode=disable/i.test(cs) ? false : { rejectUnauthorized: false };

  _pool = new Pool({
    connectionString: cs,
    ssl,
    max: parseInt(process.env.PGPOOL_MAX || "5", 10),
    idleTimeoutMillis: parseInt(process.env.PG_IDLE || "10000", 10),
    connectionTimeoutMillis: parseInt(process.env.PG_CONNECT_TIMEOUT || "8000", 10),
    keepAlive: true,
  });

  return _pool;
}

// Back-compat: allow `const { pool } = require("../../lib/db")`
const exported = { getPool };
Object.defineProperty(exported, "pool", {
  enumerable: true,
  get: () => getPool(),
});

module.exports = exported;
