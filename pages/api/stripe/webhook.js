import Stripe from "stripe";
import { getPool } from "../../../lib/db.mjs"; // pages/api/stripe → ../../../lib/db.mjs

// Stripe needs the raw body for signature verification
export const config = { api: { bodyParser: false } };

const stripeSecret  = process.env.STRIPE_SECRET_KEY || "";
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
const stripe = new Stripe(stripeSecret);

function json(res, code, obj){ return res.status(code).json(obj); }

async function readRawBuffer(req){
  const chunks = [];
  for await (const c of req) chunks.push(Buffer.isBuffer(c)? c : Buffer.from(c));
  return Buffer.concat(chunks);
}

export default async function handler(req, res){
  // No caching ever
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return json(res, 405, { error: "Method Not Allowed" });
  }
  if (!/^sk_/.test(stripeSecret))  return json(res, 500, { error: "Stripe not configured" });
  if (!/^whsec_/.test(webhookSecret)) return json(res, 500, { error: "Webhook secret not configured" });

  const sig = req.headers["stripe-signature"];
  if (!sig) return json(res, 400, { error: "Missing stripe-signature" });

  let event;
  try {
    const raw = await readRawBuffer(req);
    event = stripe.webhooks.constructEvent(raw, sig, webhookSecret);
  } catch (e) {
    console.error("webhook verify fail:", e?.message || e);
    return json(res, 400, { error: "Invalid signature" });
  }

  const pool = getPool();
  const db = await pool.connect();

  try {
    await db.query("BEGIN");

    // Idempotency: record each Stripe event id once
    const eventNote = `stripe:event:${event.id}`;
    const seen = await db.query("SELECT 1 FROM public.order_events WHERE note=$1 LIMIT 1", [eventNote]);
    if (seen.rowCount > 0) {
      await db.query("COMMIT");
      return json(res, 200, { ok: true, duplicate: true });
    }

    let order_id = null;
    let newStatus = null;

    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object;
        order_id = s?.metadata?.order_id || null;
        newStatus = "paid";
        break;
      }
      case "invoice.paid": {
        const i = event.data.object;
        order_id = i?.metadata?.order_id || null;
        newStatus = "paid";
        break;
      }
      case "invoice.payment_failed": {
        const i = event.data.object;
        order_id = i?.metadata?.order_id || null;
        newStatus = "payment_failed";
        break;
      }
      default: {
        // Log all other events for traceability, then return 200
        await db.query(
          `INSERT INTO public.order_events (order_id, event_type, status, note)
           VALUES ($1,$2,$3,$4)`,
          [null, event.type, null, eventNote]
        );
        await db.query("COMMIT");
        return json(res, 200, { ok: true, ignored: true });
      }
    }

    // Update order if known, always record the event
    if (order_id) {
      await db.query(
        `UPDATE public.orders SET status=$1, updated_at=NOW() WHERE id=$2`,
        [newStatus, order_id]
      );
      await db.query(
        `INSERT INTO public.order_events (order_id, event_type, status, note)
         VALUES ($1,$2,$3,$4)`,
        [order_id, event.type, newStatus, eventNote]
      );
    } else {
      await db.query(
        `INSERT INTO public.order_events (order_id, event_type, status, note)
         VALUES ($1,$2,$3,$4)`,
        [null, event.type, newStatus, eventNote]
      );
    }

    await db.query("COMMIT");
    return json(res, 200, { ok: true });
  } catch (e) {
    try { await db.query("ROLLBACK"); } catch {}
    console.error("webhook handler error:", e?.message || e);
    return json(res, 500, { error: "Server error" });
  } finally {
    db.release(); // DO NOT pool.end()
  }
}
