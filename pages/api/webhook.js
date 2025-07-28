import { buffer } from "micro";
import Stripe from "stripe";
import pkg from "pg";

const { Pool } = pkg;

// PostgreSQL connection pool setup using environment variables
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

export const config = {
  api: {
    bodyParser: false, // Stripe requires raw body for signature verification
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end("Method Not Allowed");
  }

  const buf = await buffer(req);
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("⚠️ Webhook signature verification failed.", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object;

        await saveOrder(session);

        console.log(`✅ Order saved successfully: ${session.id}`);
        break;

      default:
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
    const insertQuery = `
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
      session.id, // Using Stripe session ID as order ID
      session.customer_details?.email || null,
      "paid", // Mark order as paid on successful checkout completion
      (session.amount_total || 0) / 100, // Stripe amounts are in cents
      session.payment_status || "paid",
      "checkout_page",
      "stripe_checkout",
    ];

    await client.query(insertQuery, values);
  } finally {
    client.release();
  }
}
