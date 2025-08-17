let _pool;
function getPool() {
  if (_pool) return _pool;
  const { Pool } = require("pg");
  const cs = process.env.DATABASE_URL;
  if (!cs) throw new Error("Missing DATABASE_URL");
  _pool = new Pool({
    connectionString: cs,
    ssl: { rejectUnauthorized: false }, // <- Supabase pooler uses self-signed CA
    max: 5,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 8000,
    keepAlive: true
  });
  return _pool;
}

const pool = getPool();
module.exports = { pool, getPool };
