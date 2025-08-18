/**
 * /api/orders/queue
 * Fetch newly "submitted" orders for desktop polling.
 * Optional query:
 *   - since: ISO timestamp (only orders created after this)
 *   - limit: 1..100 (default 50)
 *   - include_items: "true" to include order_items per order
 *
 * Auth:
 *   - If process.env.SKIP_QUEUE_AUTH === "true", no header required (dev only).
 *   - Otherwise must send: x-inkylink-key: process.env.QUEUE_SHARED_SECRET
 *
 * Notes:
 *   - Runs server-side only (Next.js API route). No SSR/static pitfalls.
 *   - Fully parameterized queries. Limit is sanitized to integer 1..100.
 */

import { getPool } from "../../../lib/db.js"; const pool = getPool();

function assert(cond, msg, code = 400) {
  if (!cond) throw Object.assign(new Error(msg), { status: code });
}

function parseLimit(v) {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return 50;
  return Math.min(100, Math.max(1, Math.floor(n)));
}

function parseSince(v) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export default async function handler(req, res) {
  // Method guard
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // --- AUTH (shared secret OR skip via env) ---
    const skipAuth = String(process.env.SKIP_QUEUE_AUTH || "").toLowerCase() === "true";
    if (!skipAuth) {
      const secret = process.env.QUEUE_SHARED_SECRET;
      const provided = req.headers["x-inkylink-key"];
      assert(secret, "Server misconfigured: missing QUEUE_SHARED_SECRET", 500);
      assert(typeof provided === "string" && provided === secret, "Unauthorized", 401);
    }

    // --- INPUTS ---
    const since = parseSince(req.query.since);
    const limit = parseLimit(req.query.limit);
    const includeItems = String(req.query.include_items || "").toLowerCase() === "true";

    // --- DB ---
    const client = await pool.connect();
    try {
      const params = ["submitted"];
      let where = `status = $1`;
      if (since) {
        params.push(since);
        where += ` AND created_at > $2`;
      }

      // Limit is a small integer we control; keep it inline
      const ordersSql = `
        SELECT
          id::uuid,
          client_id::uuid,
          total_cents,
          total_price,
          currency,
          status,
          created_at,
          updated_at
        FROM public.orders
        WHERE ${where}
        ORDER BY created_at ASC
        LIMIT ${limit};
      `;
      const { rows: orders } = await client.query(ordersSql, params);

      let itemsByOrderId = {};
      if (includeItems && orders.length > 0) {
        const orderIds = orders.map(o => o.id);
        const placeholders = orderIds.map((_, i) => `$${i + 1}`).join(",");
        const itemsSql = `
          SELECT
            order_id::uuid,
            item_id,
            name,
            description,
            price_cents,
            quantity,
            meta
          FROM public.order_items
          WHERE order_id IN (${placeholders})
          ORDER BY order_id, id;
        `;
        const { rows: items } = await client.query(itemsSql, orderIds);
        itemsByOrderId = items.reduce((acc, it) => {
          const k = String(it.order_id);
          if (!acc[k]) acc[k] = [];
          acc[k].push({
            item_id: it.item_id,
            name: it.name,
            description: it.description,
            price_cents: it.price_cents,
            quantity: it.quantity,
            meta: it.meta,
          });
          return acc;
        }, {});
      }

      // Normalize created_at/updated_at to ISO, attach items if requested
      const out = orders.map(o => ({
        id: o.id,
        client_id: o.client_id,
        total_cents: o.total_cents,
        total_price: o.total_price,
        currency: o.currency,
        status: o.status,
        created_at: o.created_at instanceof Date ? o.created_at.toISOString() : o.created_at,
        updated_at: o.updated_at instanceof Date ? o.updated_at.toISOString() : o.updated_at,
        ...(includeItems ? { items: itemsByOrderId[String(o.id)] || [] } : {}),
      }));

      const next_since = out.length > 0
        ? new Date(out[out.length - 1].created_at).toISOString()
        : (since || null);

      return res.status(200).json({ ok: true, orders: out, next_since });
    } finally {
      client.release();
    }
  } catch (err) {
    const code = err.status || 500;
    return res.status(code).json({ error: err.message || "Internal error" });
  }
}




