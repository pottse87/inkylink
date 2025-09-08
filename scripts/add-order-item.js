"use strict";
const { Pool } = require("pg");

async function main() {
  const [orderId, catalogId, qtyArg] = process.argv.slice(2);
  if (!orderId || !catalogId) {
    console.error("usage: node scripts/add-order-item.js <orderId> <catalogItemId> [quantity]");
    process.exit(1);
  }
  const quantity = Math.max(1, Number.parseInt(qtyArg ?? "1", 10) || 1);

  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: (process.env.PGSSLMODE==="disable"||process.env.DB_SSL==="0"||process.env.DB_SSL==="false") ? false : { rejectUnauthorized: false } });
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Lock the order row to avoid concurrent edits
    const o = await client.query("SELECT id FROM public.orders WHERE id=$1 FOR UPDATE", [orderId]);
    if (o.rowCount === 0) throw new Error("order not found");

    // Fetch authoritative catalog fields
    const c = await client.query(
      "SELECT id, title, description, icon, price_cents FROM public.catalog_items WHERE id=$1",
      [catalogId]
    );
    if (c.rowCount === 0) throw new Error("catalog item not found");
    const item = c.rows[0];

    // Insert using sequence/default id; return assigned id
    const ins = await client.query(
      `INSERT INTO public.order_items
         (order_id, item_id, name, description, price_cents, quantity, meta)
       VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb)
       RETURNING id, order_id, item_id, name, price_cents, quantity`,
      [orderId, item.id, item.title, item.description || null, item.price_cents, quantity, "{}"]
    );

    // Ensure total is recalculated (trigger runs too)
    await client.query("SELECT public.recalc_order_total($1)", [orderId]);

    const tot = await client.query("SELECT total_cents FROM public.orders WHERE id=$1", [orderId]);

    await client.query("COMMIT");
    console.log(JSON.stringify({ inserted: ins.rows[0], new_total_cents: Number(tot.rows[0].total_cents) }, null, 2));
  } catch (e) {
    try { await client.query("ROLLBACK"); } catch {}
    console.error(e.message || String(e));
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(e => { console.error(e.message || String(e)); process.exit(1); });

