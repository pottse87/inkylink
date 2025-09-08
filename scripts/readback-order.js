"use strict";
const { Pool } = require("pg");

(async () => {
  const id = process.argv[2];
  if (!id) { console.error("order id required"); process.exit(1); }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: (process.env.PGSSLMODE==="disable"||process.env.DB_SSL==="0"||process.env.DB_SSL==="false") ? false : { rejectUnauthorized: false } });
  const client = await pool.connect();
  try {
    // orders row
    const o = await client.query("select id, status from public.orders where id=$1", [id]);

    // detect created_at on order_events for safe ordering
    const hasCreatedAt = await client.query(
      "select 1 from information_schema.columns where table_schema='public' and table_name='order_events' and column_name='created_at'"
    );
    const cols = "order_id, event_type, status, note" + (hasCreatedAt.rowCount ? ", created_at" : "");
    const orderBy = hasCreatedAt.rowCount ? "created_at asc nulls first" : "order_id asc";

    const e = await client.query(
      `select ${cols} from public.order_events where order_id=$1 order by ${orderBy}`,
      [id]
    );

    console.log(JSON.stringify({ order: o.rows[0] || null, events: e.rows, events_count: e.rowCount }, null, 2));
  } catch (err) {
    console.error(err.message || String(err));
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
})();

