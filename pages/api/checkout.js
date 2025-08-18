import Stripe from "stripe";
import { getPool } from "lib/db.js"; const pool = getPool();
import { randomUUID } from "crypto";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });

function assert(cond, msg, code = 400) {
  if (!cond) throw Object.assign(new Error(msg), { status: code });
}

async function fetchCart(client, clientId) {
  const { rows } = await client.query("SELECT items FROM carts WHERE client_id = $1", [clientId]);
  return rows[0]?.items || [];
}

function sumCents(items) {
  return items.reduce((acc, it) => acc + (Number(it.price_cents) || 0) * (Number(it.quantity) || 1), 0);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { client_id, session_id } = req.body || {};

  try {
    assert(client_id && typeof client_id === "string", "client_id is required");
    assert(session_id && typeof session_id === "string", "session_id is required");

    // Verify paid
    const session = await stripe.checkout.sessions.retrieve(session_id, { expand: ["payment_intent"] });
    assert(session?.payment_status === "paid", "Stripe session is not paid", 402);

    const idempotencyKey = session.id;
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Idempotency: if we already wrote this order, return it
      const { rows: existing } = await client.query(
        "SELECT id, status FROM orders WHERE idempotency_key = $1",
        [idempotencyKey]
      );
      if (existing[0]) {
        await client.query("COMMIT");
        return res
          .status(200)
          .json({ ok: true, order_id: existing[0].id, status: existing[0].status, idempotent: true });
      }

      const items = await fetchCart(client, client_id);
      assert(Array.isArray(items) && items.length > 0, "Cart is empty");

      const totalCents = sumCents(items);
      const orderId = randomUUID();

      // Insert order
      await client.query(
        `INSERT INTO orders (id, client_id, total_cents, currency, status, source, idempotency_key, created_at, updated_at)
         VALUES ($1, $2, $3, $4, 'submitted', 'web', $5, NOW(), NOW())`,
        [orderId, client_id, totalCents, "usd", idempotencyKey]
      );

      // Insert order_items with parameterized multi-row VALUES
      const insertValues = [];
      const params = [];
      // each row uses 7 params
      let p = 1;
      for (const it of items) {
        insertValues.push(`($${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++}, $${p++})`);
        params.push(
          orderId,
          it.id,
          it.name,
          it.description || "",
          Number(it.price_cents) || 0,
          Number(it.quantity) || 1,
          JSON.stringify({ icon: it.icon || null })
        );
      }
      await client.query(
        `INSERT INTO order_items (order_id, item_id, name, description, price_cents, quantity, meta)
         VALUES ${insertValues.join(",")}`,
        params
      );

      // Event log
      await client.query(
        `INSERT INTO order_events (order_id, event_type, payload)
         VALUES ($1, 'status_change', $2::jsonb)`,
        [orderId, JSON.stringify({ from: null, to: "submitted" })]
      );

      await client.query("COMMIT");
      return res.status(200).json({ ok: true, order_id: orderId, status: "submitted", total_cents: totalCents });
    } catch (e) {
      // ✅ use the same client for ROLLBACK
      await (async () => {
        try { await client.query("ROLLBACK"); } catch {}
      })();
      throw e;
    } finally {
      client.release();
    }
  } catch (err) {
    const code = err.status || 500;
    return res.status(code).json({ error: err.message || "Internal error" });
  }
}

