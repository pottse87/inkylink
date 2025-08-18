'use strict';

// Lazy, safe, backward-compatible Postgres pool.
// Nothing touches the DB at import time.

let _pool = null;

function createPool() {
  const cs = process.env.DATABASE_URL;
  if (!cs) {
    const err = new Error('Missing DATABASE_URL');
    err.code = 'NO_DATABASE_URL';
    throw err; // Only thrown when the pool is actually used
  }
  const { Pool } = require('pg');
  return new Pool({
    connectionString: cs,
    // Supabase pooler uses self-signed CA
    ssl: { rejectUnauthorized: false },
    max: 5,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 8000,
    keepAlive: true,
  });
}

function getPool() {
  if (_pool) return _pool;
  _pool = createPool();
  return _pool;
}

// Backward-compatible export: a lazy "pool" proxy.
// Importing does NOT create a connection. The first method call (e.g. .query)
// instantiates the real pool and binds methods correctly.
const pool = new Proxy({}, {
  get(_target, prop) {
    const p = getPool();
    const value = p[prop];
    return (typeof value === 'function') ? value.bind(p) : value;
  },
});

module.exports = { getPool, pool };
