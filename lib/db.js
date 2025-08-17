let _pool;
function getPool() {
  if (_pool) return _pool;
  const { Pool } = require("pg");
  const cs = process.env.DATABASE_URL;
  if (!cs) throw new Error("Missing DATABASE_URL");
  _pool = new Pool({
    connectionString: cs,
    // IMPORTANT for Supabase pooler on Vercel:
    ssl: { rejectUnauthorized: false },
  });
  return _pool;
}

const pool = getPool();
module.exports = { pool, getPool };
