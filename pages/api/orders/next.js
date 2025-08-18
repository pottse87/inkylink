import { getPool } from "lib/db.js"; const pool = getPool();

function auth(req) {
  const token = req.headers["x-desktop-token"];
  if (!token || token !== process.env.INKYLINK_DESKTOP_TOKEN) {
    const e = new Error("Unauthorized");
    e.status = 401;
    throw e;
  }
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    auth(req);
    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const { rows: pick } = await client.query(
        `SELECT id FROM orders
         WHERE status = 'submitted'
         ORDER BY created_at ASC
         FOR UPDATE SKIP LOCKED
         LIMIT 1`
      );

      if (pick.length === 0) {
        await client.query("COMMIT");
        return res.status(200).json({ order: null });
      }

      const orderId = pick[0].id;

      await client.query(
        "UPDATE orders SET status = 'queued', updated_at = NOW() WHERE id = $1",
        [orderId]
      );

      await client.query(
        `INSERT INTO order_events (order_id, event_type, payload)
         VALUES ($1, 'status_change', $2::jsonb)`,
        [orderId, JSON.stringify({ from: "submitted", to: "queued" })]
      );

      const { rows: orderRows } = await client.query(
        `SELECT id, client_id, total_cents, currency, status, created_at, updated_at
         FROM orders WHERE id = $1`,
        [orderId]
      );
      const { rows: itemRows } = await client.query(
        `SELECT item_id, name, description, price_cents, quantity, meta
         FROM order_items WHERE order_id = $1`,
        [orderId]
      );

      await client.query("COMMIT");
      return res.status(200).json({ order: orderRows[0], items: itemRows });
    } catch (e) {
      await pool.query("ROLLBACK").catch(() => {});
      throw e;
    } finally {
      client.release();
    }
  } catch (err) {
    const code = err.status || 500;
    return res.status(code).json({ error: err.message || "Internal error" });
  }
}



