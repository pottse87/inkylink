"use strict";
const { Pool } = require("pg");
(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: (process.env.PGSSLMODE==="disable"||process.env.DB_SSL==="0"||process.env.DB_SSL==="false") ? false : { rejectUnauthorized: false }});
  const c = await pool.connect();
  try {
    const cols = await c.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema='public' AND table_name='orders'
      ORDER BY ordinal_position
    `);
    const cons = await c.query(`
      SELECT conname AS name, pg_get_constraintdef(oid) AS def
      FROM pg_constraint
      WHERE conrelid='public.orders'::regclass
      ORDER BY conname
    `);
    const trgs = await c.query(`
      SELECT tgname AS name
      FROM pg_trigger
      WHERE tgrelid='public.orders'::regclass AND NOT tgisinternal
      ORDER BY tgname
    `);
    const idxs = await c.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE schemaname='public' AND tablename='orders'
      ORDER BY indexname
    `);
    console.log(JSON.stringify({
      columns: cols.rows,
      constraints: cons.rows,
      triggers: trgs.rows,
      indexes: idxs.rows
    }, null, 2));
  } finally {
    c.release(); await pool.end();
  }
})().catch(e => { console.error(e.message || String(e)); process.exit(1); });

