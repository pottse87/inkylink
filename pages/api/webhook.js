import { buffer } from "micro";
import Stripe from "stripe";
import pkg from "pg";

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

export const config = {
  api: {
    bodyParser: false, // Required for Stripe webhook signature verification
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method === "GET") {
    // For testing endpoint is live
    return res.status(200).json({ message: "Webhook endpoint is live" });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, GET");
    return res.status(405).end("Method Not Allowed");
  }

  let event;

  try {
    const buf = await buffer(req);
    const sig = req.headers["stripe-signature"];
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("⚠️ Webhook signature verification failed.", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      await saveOrder(session);
      console.log(`✅ Order saved successfully: ${session.id}`);
    } else {
      console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error("❌ Error processing webhook event:", err);
    res.status(500).send("Internal Server Error");
  }
}

async function saveOrder(session) {
  const client = await pool.connect();

  try {
    const query = `
      INSERT INTO orders (
        id,
        customer_email,
        status,
        total_price,
        payment_status,
        submitted_at,
        source_page,
        source_campaign,
        created_at
      ) VALUES (
        $1, $2, $3, $4, $5, NOW(), $6, $7, NOW()
      )
      ON CONFLICT (id) DO NOTHING;
    `;

    const values = [
      session.id,
      session.customer_details?.email || null,
      "paid",
      (session.amount_total || 0) / 100,
      session.payment_status || "paid",
      "checkout_page",
      "stripe_checkout",
    ];

    await client.query(query, values);
  } finally {
    client.release();
  }
}
