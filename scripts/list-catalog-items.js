"use strict";
const { Pool } = require("pg");

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: (process.env.PGSSLMODE==="disable"||process.env.DB_SSL==="0"||process.env.DB_SSL==="false") ? false : { rejectUnauthorized: false } });
  const { rows } = await pool.query(`
    select id, title, price_cents
    from public.catalog_items
    order by id asc
    limit 25
  `);
  console.log(JSON.stringify(rows, null, 2));
  await pool.end();
})();

