import { getPool } from '../../../lib/db';

"use strict";

const TOKEN = String(process.env.INKYLINK_DESKTOP_TOKEN || "").trim();
const CLAIMABLE = new Set(["submitted","paid"]); // states eligible to be claimed
const EVENT_TYPE = "claim";

async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const headerToken = String(req.headers["x-desktop-token"] || "").trim();
  if (!TOKEN || headerToken !== TOKEN) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Lock a single claimable order deterministically, skipping locked rows.
    const found = await client.query(
      `
      SELECT id, client_id, total_cents, currency
      FROM public.orders
      WHERE status = ANY($1::text[])
      ORDER BY created_at ASC NULLS LAST, id ASC
      FOR UPDATE SKIP LOCKED
      LIMIT 1
      `,
      [[...CLAIMABLE]]
    );

    if (found.rowCount === 0) {
      await client.query("COMMIT");
      return res.status(200).json({ order: null, claimed: false });
    }

    const o = found.rows[0];

    // Load items for the order
    const items = await client.query(
      `
      SELECT item_id, name, price_cents, quantity
      FROM public.order_items
      WHERE order_id = $1
      ORDER BY id ASC
      `,
      [o.id]
    );

    // Transition to processing and journal the claim
    await client.query(
      "UPDATE public.orders SET status='processing', updated_at=NOW() WHERE id=$1",
      [o.id]
    );
    await client.query(
      "INSERT INTO public.order_events (order_id, event_type, status, note) VALUES ($1,$2,$3,$4)",
      [o.id, EVENT_TYPE, "processing", "claimed by desktop"]
    );

    await client.query("COMMIT");

    return res.status(200).json({
      claimed: true,
      order: {
        id: o.id,
        client_id: o.client_id || null,
        status: "processing",
        total_cents: Number(o.total_cents || 0),
        currency: o.currency || "usd",
        items: items.rows.map(r => ({
          id: r.item_id,
          name: r.name,
          price_cents: Number(r.price_cents || 0),
          quantity: Number(r.quantity || 1),
        })),
      }
    });
  } catch (e) {
    try { await client.query("ROLLBACK"); } catch {}
    return res.status(500).json({ error: e.message || String(e) });
  } finally {
    client.release();
  }
}
export default handler;


