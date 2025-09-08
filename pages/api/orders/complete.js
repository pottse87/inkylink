/**
 * /api/orders/complete
 * POST { order_id: UUID, note?: string }
 *
 * Marks an order as completed, writes an order_events record, returns { ok, order_id }.
 *
 * Auth:
 *   - If process.env.SKIP_QUEUE_AUTH === "true", no header required (dev only).
 *   - Else header must be present: x-inkylink-key: process.env.QUEUE_SHARED_SECRET
 */

import { getPool } from "../../../lib/db.mjs"; const pool = getPool();

function assert(cond, msg, code = 400) {
  if (!cond) throw Object.assign(new Error(msg), { status: code });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // --- AUTH (same as queue) ---
    const skipAuth = String(process.env.SKIP_QUEUE_AUTH || "").toLowerCase() === "true";
    if (!skipAuth) {
      const secret = process.env.QUEUE_SHARED_SECRET;
      const provided = req.headers["x-inkylink-key"];
      assert(secret, "Server misconfigured: missing QUEUE_SHARED_SECRET", 500);
      assert(typeof provided === "string" && provided === secret, "Unauthorized", 401);
    }

    // --- INPUTS ---
    const { order_id, note } = req.body || {};
    assert(typeof order_id === "string" && order_id.length > 0, "order_id is required");

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Lock the order row so concurrent updates don't conflict
      const { rows: existingRows } = await client.query(
        `SELECT id, status FROM public.orders WHERE id = $1 FOR UPDATE`,
        [order_id]
      );
      assert(existingRows.length === 1, "Order not found", 404);

      const fromStatus = existingRows[0].status ?? null;

      // Update status + updated_at
      await client.query(
        `UPDATE public.orders
           SET status = 'completed',
               updated_at = NOW()
         WHERE id = $1`,
        [order_id]
      );

      // Event: status_change — cast $2 to text so PG knows the type even when NULL
      await client.query(
        `INSERT INTO public.order_events (order_id, event_type, payload, created_at)
               VALUES ($1, 'status_change',
                       jsonb_build_object('from', $2::text, 'to', 'completed'),
                       NOW())`,
        [order_id, fromStatus]
      );

      // Optional: note — also cast to text
      if (note && typeof note === "string" && note.trim().length > 0) {
        await client.query(
          `INSERT INTO public.order_events (order_id, event_type, payload, created_at)
                 VALUES ($1, 'completion_note',
                         jsonb_build_object('note', $2::text),
                         NOW())`,
          [order_id, note.trim()]
        );
      }

      await client.query("COMMIT");
      return res.status(200).json({ ok: true, order_id });
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  } catch (err) {
    const code = err.status || 500;
    return res.status(code).json({ error: err.message || "Internal error" });
  }
}





