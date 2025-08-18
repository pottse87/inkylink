"use strict";

// Lazy, singleton Pool. NOTHING runs on import.
let _pool = null;

function getPool() {
  if (_pool) return _pool;

  const { Pool } = require("pg");
  const cs = process.env.DATABASE_URL;
  if (!cs) {
    throw new Error("Missing DATABASE_URL");
  }

  _pool = new Pool({
    connectionString: cs,
    ssl: { rejectUnauthorized: false }, // Supabase pooler uses self-signed CA
    max: 5,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 8_000,
    keepAlive: true,
  });

  _pool.on("error", (err) => {
    console.error("[pg] idle client error:", err?.message || err);
  });

  return _pool;
}

// Convenience helper
async function withClient(fn) {
  const pool = getPool();
  const client = await pool.connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}

module.exports = { getPool, withClient };
