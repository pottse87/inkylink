// pages/api/stripe/webhook.js
import Stripe from "stripe";
import { getPool } from "../../../lib/db.mjs"; // from /pages/api/stripe to /lib

export const config = {
  api: { bodyParser: false }, // needed to verify signatures
};

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";
const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY) : null;

// helper: read raw request body (no extra deps)
function readRawBody(req) {
  return new Promise((resolve, reject) => {
    try {
      const chunks = [];
      req.on("data", (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
      req.on("end", () => resolve(Buffer.concat(chunks)));
      req.on("error", reject);
    } catch (e) {
      reject(e);
    }
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  if (!stripe || !STRIPE_WEBHOOK_SECRET) {
    return res.status(500).json({ error: "Stripe webhook not configured" });
  }

  let event;
  try {
    const raw = await readRawBody(req);
    const sig = req.headers["stripe-signature"];
    event = stripe.webhooks.constructEvent(raw, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("webhook signature verify failed:", err?.message || err);
    return res.status(400).json({ error: "Invalid signature" });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const meta = session?.metadata || {};
        const order_id = meta.order_id || null;
        const client_id = meta.client_id || null;

        if (order_id) {
          const pool = getPool();
          const db = await pool.connect();
          try {
            // Minimal, safe update: only touch known columns
            await db.query(
              `UPDATE public.orders
                 SET status='paid', updated_at=NOW()
               WHERE id = $1`,
              [order_id]
            );

            // Best-effort event log if table exists (ignore if it doesn't)
            try {
              await db.query(
                `INSERT INTO public.order_events (order_id, event_type, status, note)
                 VALUES ($1,$2,$3,$4)`,
                [order_id, "webhook", "paid", "stripe: checkout.session.completed"]
              );
            } catch (_) {}
          } finally {
            db.release();
          }
        }
        break;
      }

      // (Optional) handle other events as you need
      // case "payment_intent.succeeded":
      // case "invoice.paid":
      //   break;

      default:
        // ignore others
        break;
    }

    return res.status(200).json({ received: true });
  } catch (e) {
    console.error("webhook handler error:", e?.stack || e?.message || e);
    // Let Stripe retry if DB is temporarily down
    return res.status(500).json({ error: "Webhook processing error" });
  }
}

