"use strict";
const { Pool } = require("pg");
(async () => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: (process.env.PGSSLMODE==="disable"||process.env.DB_SSL==="0"||process.env.DB_SSL==="false") ? false : { rejectUnauthorized:false }
  });
  const c = await pool.connect();
  try {
    const id = process.argv[2];
    const r = await c.query(`SELECT id,status,total_cents,currency,stripe_session_id,created_at,updated_at FROM public.orders WHERE id=$1`, [id]);
    console.log(JSON.stringify(r.rows[0]||{}, null, 2));
  } finally { c.release(); await pool.end(); }
})().catch(e => { console.error(e.message||String(e)); process.exit(1); });
