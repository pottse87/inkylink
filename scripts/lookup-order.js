"use strict";
const { Pool } = require("pg");

(async () => {
  const cs = process.env.DATABASE_URL;
  if (!cs) { console.error("DATABASE_URL not set"); process.exit(1); }
  const id = process.argv[2] || "";
  const pool = new Pool({ connectionString: cs, ssl: (process.env.PGSSLMODE==="disable"||process.env.DB_SSL==="0"||process.env.DB_SSL==="false") ? false : { rejectUnauthorized: false } });
  const client = await pool.connect();
  try {
    const hasCreatedAt = await client.query(
      "select 1 from information_schema.columns where table_schema='public' and table_name='orders' and column_name='created_at'"
    );

    let order = null;
    if (id) {
      const r = await client.query(
        `select id, status${hasCreatedAt.rowCount ? ", created_at" : ""} from public.orders where id=$1`,
        [id]
      );
      if (r.rowCount) order = r.rows[0];
    }

    const orderBy = hasCreatedAt.rowCount ? "created_at desc nulls last" : "id desc";
    const recent = await client.query(
      `select id, status${hasCreatedAt.rowCount ? ", created_at" : ""} from public.orders order by ${orderBy} limit 10`
    );

    console.log(JSON.stringify({ found: Boolean(order), order, recent: recent.rows }, null, 2));
  } catch (e) {
    console.error(e.message || String(e));
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
})();

