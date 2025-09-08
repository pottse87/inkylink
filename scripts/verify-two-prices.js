"use strict";
const { Pool } = require("pg");
(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: (process.env.PGSSLMODE==="disable"||process.env.DB_SSL==="0"||process.env.DB_SSL==="false") ? false : { rejectUnauthorized: false }});
  const c = await pool.connect();
  try {
    const q = await c.query(
      "SELECT id, title, stripe_price_id FROM public.catalog_items WHERE id IN ('ongoing-optimization','conversion-booster-pro') ORDER BY id"
    );
    console.log(JSON.stringify(q.rows, null, 2));
  } finally { c.release(); await pool.end(); }
})();

