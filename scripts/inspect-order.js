"use strict";
const { Pool } = require("pg");

(async () => {
  const id = process.argv[2];
  if (!id) { console.error("order id required"); process.exit(1); }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: (process.env.PGSSLMODE==="disable"||process.env.DB_SSL==="0"||process.env.DB_SSL==="false") ? false : { rejectUnauthorized: false } });
  const c = await pool.connect();
  try {
    const hasCreatedAt = await c.query(`
      select 1 from information_schema.columns
      where table_schema='public' and table_name='orders' and column_name='created_at'
    `);
    const orderSql = hasCreatedAt.rowCount
      ? "select id, status, currency, total_cents, created_at from public.orders where id=$1"
      : "select id, status, currency, total_cents from public.orders where id=$1";

    const o = await c.query(orderSql, [id]);
    const items = await c.query(
      "select id, item_id, name, price_cents, quantity from public.order_items where order_id=$1 order by id asc",
      [id]
    );

    console.log(JSON.stringify({
      order: o.rows[0] || null,
      item_count: items.rowCount,
      items: items.rows
    }, null, 2));
  } catch (e) {
    console.error(e.message || String(e));
    process.exit(1);
  } finally {
    c.release(); await pool.end();
  }
})();

