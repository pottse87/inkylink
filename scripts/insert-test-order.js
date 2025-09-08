#!/usr/bin/env node
"use strict";
const { randomUUID } = require("crypto");
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: (process.env.PGSSLMODE==="disable"||process.env.DB_SSL==="0"||process.env.DB_SSL==="false") ? false : { rejectUnauthorized: false }
});

(async () => {
  const c = await pool.connect();
  try {
    const clientId = randomUUID(); // ✅ valid uuid for your client_id column
    const r = await c.query(
      `insert into public.orders (client_id,total_cents,currency,status,source,session_id)
       values ($1,$2,$3,$4,$5,$6)
       returning id, client_id`,
      [clientId, 12345, 'usd', 'submitted', 'smoke', 'sess_test_123']
    );
    console.log(JSON.stringify(r.rows[0])); // prints {"id":"...","client_id":"..."}
  } finally {
    c.release();
    await pool.end();
  }
})();

