"use strict";

let _pool = null;

function cleanEnv(v) {
  if (!v) return "";
  return String(v).replace(/\0/g, "").replace(/\r?\n/g, "").trim();
}

function getPool() {
  if (_pool) return _pool;

  const { Pool } = require("pg");
  const raw = process.env.DATABASE_URL;
  const connectionString = cleanEnv(raw);
  if (!connectionString) throw new Error("Missing DATABASE_URL");

  _pool = new Pool({
    connectionString,
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
