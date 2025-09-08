// pages/api/dev/order-status.js
import { getPool } from "../../../lib/db.mjs";

export default async function handler(req, res) {
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({ error: "Disabled in production" });
  }

  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const order_id = String(req.query.order_id || "").trim();
  if (!order_id) return res.status(400).json({ error: "order_id required" });

  const pool = getPool();
  const db = await pool.connect();
  try {
    const r = await db.query(
      `SELECT id, client_id, status, total_cents, stripe_session_id, created_at, updated_at
         FROM public.orders
        WHERE id = $1`,
      [order_id]
    );
    if (r.rowCount === 0) return res.status(404).json({ error: "not found" });
    return res.status(200).json(r.rows[0]);
  } catch (e) {
    console.error("dev order-status error:", e?.stack || e?.message || e);
    return res.status(500).json({ error: "query failed" });
  } finally {
    db.release();
  }
}

