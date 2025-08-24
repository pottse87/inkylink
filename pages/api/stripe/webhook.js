import Stripe from "stripe";
import { buffer } from "micro";

export const config = { api: { bodyParser: false } };

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const sig = req.headers["stripe-signature"];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return res.status(500).json({ error: "STRIPE_WEBHOOK_SECRET not set" });

  try {
    const buf = await buffer(req);
    const event = stripe.webhooks.constructEvent(buf, sig, secret);

    if (event.type === "checkout.session.completed") {
      // Optional: mark order paid here if you persist orders server-side.
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }
}
