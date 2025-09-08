// pages/api/dev/checkout-complete.js
// Dev-only helper: mark an order as "paid" like the Stripe webhook would.
// Requires: ENABLE_DEV_TOOLS=1 in .env.local (and NEVER on production).

import { getPool } from "../../../lib/db";

export default async function handler(req, res) {
  if (process.env.ENABLE_DEV_TOOLS !== "1") {
    return res.status(403).json({ error: "dev tools disabled" });
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { order_id, client_id } = req.body || {};
  if (!order_id) return res.status(400).json({ error: "order_id required" });

  const pool = getPool();
  const db = await pool.connect();
  try {
    await db.query(
      `UPDATE public.orders
         SET status='paid', updated_at=NOW()
       WHERE id=$1`,
      [order_id]
    );

    // Best-effort event log (ignore if table missing)
    try {
      await db.query(
        `INSERT INTO public.order_events (order_id, event_type, status, note)
         VALUES ($1,$2,$3,$4)`,
        [order_id, "dev", "paid", "dev: simulated checkout.session.completed"]
      );
    } catch (_) {}

    return res.status(200).json({ ok: true, order_id, client_id });
  } catch (e) {
    console.error("dev/checkout-complete:", e?.stack || e?.message || e);
    return res.status(500).json({ error: "Internal Server Error" });
  } finally {
    try { db.release(); } catch {}
  }
}
