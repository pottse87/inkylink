/**
 * GET /api/orders/get?id=<order_uuid>
 * Public read: returns a single order (and items) by id.
 * Safe to expose: UUID is unguessable; this is read-only.
 * Notes:
 *  - Fully parameterized SQL
 *  - No SSR issues (API route only)
 */

import { getPool } from "lib/db.js"; const pool = getPool();

function bad(res, code, msg) {
  return res.status(code).json({ error: msg });
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return bad(res, 405, "Method not allowed");
  }

  const id = String(req.query.id || "").trim();
  if (!id) return bad(res, 400, "id is required");

  const client = await pool.connect();
  try {
    const { rows: orders } = await client.query(
      `SELECT
         id::uuid,
         client_id::uuid,
         total_cents,
         total_price,
         currency,
         status,
         created_at,
         updated_at
       FROM public.orders
       WHERE id = $1
       LIMIT 1`,
      [id]
    );

    if (orders.length === 0) return bad(res, 404, "Order not found");
    const order = orders[0];

    const { rows: items } = await client.query(
      `SELECT
         item_id,
         name,
         description,
         price_cents,
         quantity,
         meta
       FROM public.order_items
       WHERE order_id = $1
       ORDER BY id`,
      [id]
    );

    // Normalize timestamps to ISO for the browser
    const normalize = (v) =>
      v instanceof Date ? v.toISOString() : v;

    const out = {
      ...order,
      created_at: normalize(order.created_at),
      updated_at: normalize(order.updated_at),
    };

    return res.status(200).json({ ok: true, order: out, items });
  } catch (err) {
    return bad(res, 500, err.message || "Internal error");
  } finally {
    client.release();
  }
}



