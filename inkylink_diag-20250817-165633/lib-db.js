// lib/db.js
let _pool;

function getPool() {
  if (_pool) return _pool;

  const { Pool } = require("pg");
  const cs = process.env.DATABASE_URL;
  if (!cs) throw new Error("Missing DATABASE_URL");

  _pool = new Pool({
    connectionString: cs,
    // Supabase pgbouncer/self-signed CA => don't reject
    ssl: { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 8_000,
    keepAlive: true,
  });

  return _pool;
}

const pool = getPool();
module.exports = { pool, getPool };

