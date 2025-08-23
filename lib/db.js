"use strict";
// lib/db.js - pooled Postgres connector
let _pool;
function getPool() {
  if (_pool) return _pool;
  const { Pool } = require("pg");
  const cs = process.env.DATABASE_URL;
  if (!cs) { const e = new Error("Missing DATABASE_URL"); e.status = 500; throw e; }
  _pool = new Pool({
    connectionString: cs,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
  return _pool;
}
async function withClient(fn) {
  const pool = getPool();
  const client = await pool.connect();
  try { return await fn(client); } finally { client.release(); }
}
module.exports = { getPool, withClient };
