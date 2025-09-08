"use strict";
const { Pool } = require("pg");

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: (process.env.PGSSLMODE==="disable"||process.env.DB_SSL==="0"||process.env.DB_SSL==="false") ? false : { rejectUnauthorized: false } });
  const client = await pool.connect();
  try {
    const count = await client.query("select count(*)::int as n from public.catalog_items");
    const rows  = await client.query("select id, title, price_cents from public.catalog_items order by id asc");
    console.log(JSON.stringify({ count: count.rows[0].n, items: rows.rows }, null, 2));
  } catch (e) {
    console.error(e.message || String(e)); process.exit(1);
  } finally {
    client.release(); await pool.end();
  }
})();

