// pages/api/orders/[id]/status.js
"use strict";
export const config = { runtime: "nodejs" };

import { getPool } from "../../../../lib/db.js";
const pool = getPool();

// --- helpers & constants at module scope ---
function auth(req) {
  const token = req.headers["x-desktop-token"];
  if (!token || token !== process.env.INKYLINK_DESKTOP_TOKEN) {
    const e = new Error("Unauthorized");
    e.status = 401;
    throw e;
  }
}

const LEGAL = new Map([
  ["queued", new Set(["processing", "failed"])],
  ["processing", new Set(["completed", "failed", "rework_requested"])],
  ["rework_requested", new Set(["processing"])],
]);

// --- single default handler ---
export default async function handler(req, res) {
  // headers first so they apply on every branch
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (req.method !== "PATCH") {
    res.setHeader("Allow", ["PATCH"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    auth(req);

    const id = String(req.query.id || "").trim();
    if (!id) return res.status(400).json({ error: "order id required" });

    const { status, note } = req.body || {};
    if (!status || typeof status !== "string") {
      return res.status(400).json({ error: "status required" });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const { rows } = await client.query(
        "SELECT status FROM orders WHERE id = $1 FOR UPDATE",
        [id]
      );
      const cur = rows[0];
      if (!cur) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "order not found" });
      }

      const from = cur.status;
      if (!LEGAL.get(from)?.has(status)) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: `illegal transition: ${from} -> ${status}` });
      }

      await client.query(
        "UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2",
        [status, id]
      );

      await client.query(
        `INSERT INTO order_events (order_id, event_type, payload)
         VALUES ($1, 'status_change', $2::jsonb)`,
        [id, JSON.stringify({ from, to: status, note: note || null })]
      );

      await client.query("COMMIT");
      return res.status(200).json({ ok: true, from, to: status });
    } catch (e) {
      try { await client.query("ROLLBACK"); } catch {}
      throw e;
    } finally {
      client.release();
    }
  } catch (err) {
    const code = err.status || 500;
    return res.status(code).json({ error: err.message || "Internal error" });
  }
}
