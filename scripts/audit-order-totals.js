"use strict";
const { Pool } = require("pg");

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: (process.env.PGSSLMODE==="disable"||process.env.DB_SSL==="0"||process.env.DB_SSL==="false") ? false : { rejectUnauthorized: false } });
  const client = await pool.connect();
  try {
    const orders = await client.query(`
      select id, coalesce(total_cents,0)::bigint as total_cents
      from public.orders
      order by created_at desc nulls last, id desc
      limit 50
    `);

    const results = [];
    for (const o of orders.rows) {
      const { rows } = await client.query(`
        select coalesce(sum(coalesce(oi.price_cents,0)::bigint * coalesce(oi.quantity,1)::bigint),0)::bigint as computed_total
        from public.order_items oi
        where oi.order_id = $1
      `, [o.id]);

      // pg returns BIGINT as string; coerce both to BigInt
      const stored = BigInt(o.total_cents ?? 0);
      const computed = BigInt(rows[0].computed_total ?? 0);

      results.push({
        id: o.id,
        stored_total_cents: Number(stored),
        computed_total_cents: Number(computed),
        mismatch: stored !== computed
      });
    }

    const mismatches = results.filter(r => r.mismatch).length;
    console.log(JSON.stringify({ count: results.length, mismatches, results }, null, 2));
  } catch (e) {
    console.error(e.message || String(e));
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
})();

