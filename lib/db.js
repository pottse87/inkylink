// lib/db.js
// Lazy, non-throwing PG pool for serverless functions.
// - Never throws at import time
// - Creates the pool on first use
// - Keeps existing call sites that do: const { pool } = require("../../lib/db")

let _pool = null;

function _tryCreatePool() {
  // Guard: if "pg" isn't available (build/runtime mismatch), do not throw.
  let Pool;
  try {
    ({ Pool } = require("pg"));
  } catch {
    return null;
  }

  const cs = process.env.DATABASE_URL;
  if (!cs) return null;

  return new Pool({
    connectionString: cs,
    // Supabase pooler commonly uses self-signed CA
    ssl: { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 8_000,
    keepAlive: true,
  });
}

function getPool() {
  if (_pool) return _pool;
  _pool = _tryCreatePool();
  return _pool; // may be null if missing DATABASE_URL or pg unavailable
}

// Export shape compatible with existing destructuring usage.
const exported = {};
Object.defineProperty(exported, "pool", {
  enumerable: true,
  configurable: false,
  get() {
    return getPool(); // may return null; callers must handle
  },
});
exported.getPool = getPool;

module.exports = exported;
