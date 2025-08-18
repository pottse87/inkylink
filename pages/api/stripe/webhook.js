import Stripe from "stripe";
import { buffer } from "micro";
// import { getPool } from "lib/db.js"; const pool = getPool(); // not needed yet

export const config = {
  api: { bodyParser: false },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) return res.status(500).json({ error: "STRIPE_WEBHOOK_SECRET not set" });

  let event;
  try {
    const buf = await buffer(req);
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err) {
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  // We only need the authoritative paid signal; orders are created by /api/checkout
  if (event.type === "checkout.session.completed") {
    // You can log or store minimal info here if you want.
  }

  return res.status(200).json({ received: true });
}



