"use strict";
const { Pool } = require("pg");
(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: (process.env.PGSSLMODE==="disable"||process.env.DB_SSL==="0"||process.env.DB_SSL==="false") ? false : { rejectUnauthorized: false }});
  const c = await pool.connect();
  try {
    const q = await c.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE schemaname='public' AND tablename='orders' AND indexname='idx_orders_stripe_session_id_unique'
    `);
    console.log(JSON.stringify({ exists: q.rowCount > 0, rowCount: q.rowCount, rows: q.rows }, null, 2));
  } finally {
    c.release(); await pool.end();
  }
})().catch(e => { console.error(e.message || String(e)); process.exit(1); });

