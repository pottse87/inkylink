import Stripe from "stripe";
import { getPool } from "../../lib/db.mjs"; // from /pages/api → /lib

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { client_id, plan_id, billing } = (req.body ?? {});
  const isValidBilling = /^(monthly|yearly)$/.test(billing ?? "");
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(client_id||""));
  if (!isUuid || !plan_id || !isValidBilling) {
    return res.status(400).json({ error: "client_id must be UUID; plan_id and billing required" });
  }

  const stripeSecret = process.env.STRIPE_SECRET_KEY || "";
  if (!/^sk_/.test(stripeSecret)) {
    return res.status(500).json({ error: "Stripe not configured" });
  }
  if (!process.env.DATABASE_URL) {
    return res.status(500).json({ error: "DATABASE_URL not configured" });
  }

  const inferredProto = (req.headers["x-forwarded-proto"] || "https");
  const inferredHost = req.headers.host || "localhost:3000";
  const siteBase =
    (process.env.NEXT_PUBLIC_SITE_URL && process.env.NEXT_PUBLIC_SITE_URL.trim()) ||
    `${inferredProto}://${inferredHost}`;

  // default mapping (fallback if env overrides not set)
  const prices = {
    starter: { monthly:"price_1RrASOFjDGmKohCH3emQcGkw", yearly:"price_1RrAWzFjDGmKohCHaTwI70lD", cents:{monthly:6900,  yearly:69900}  },
    growth:  { monthly:"price_1RrAZCFjDGmKohCHxEnUiiHn", yearly:"price_1RrAa2FjDGmKohCHOnxsKpAJ", cents:{monthly:12900, yearly:129900} },
    pro:     { monthly:"price_1RrAcJFjDGmKohCHEzzR4KF7", yearly:"price_1RrAdjFjDGmKohCHwYxagpG4", cents:{monthly:22900, yearly:229900} },
    elite:   { monthly:"price_1RrAfJFjDGmKohCHuZ3dZPUs", yearly:"price_1RrAglFjDGmKohCHmVeQg6YC", cents:{monthly:32900, yearly:329900} },
  };
  const plan = prices[plan_id];
  if (!plan) return res.status(400).json({ error: "Unknown plan_id" });

  // Allow env override: STRIPE_PRICE_STARTER_MONTHLY, etc.
  function envOverride(pid, bill) {
    const key = `STRIPE_PRICE_${pid.toUpperCase()}_${bill.toUpperCase()}`;
    return process.env[key] || null;
  }
  const candidateId = envOverride(plan_id, billing) || (billing === "monthly" ? plan.monthly : plan.yearly);

  // Validate price is usable (active + product active + recurring interval matches)
  const stripe = new Stripe(stripeSecret);
  let price;
  try {
    price = await stripe.prices.retrieve(candidateId, { expand: ["product"] });
  } catch (e) {
    return res.status(400).json({ error: "Stripe price not found", price_id: candidateId });
  }
  const interval = billing === "monthly" ? "month" : "year";
  if (!price.active || !(price.product && price.product.active)) {
    return res.status(400).json({ error: "Stripe price/product inactive", price_id: candidateId });
  }
  if (price.type !== "recurring" || !price.recurring || price.recurring.interval !== interval) {
    return res.status(400).json({ error: "Stripe price interval mismatch", price_id: candidateId, expected: interval });
  }

  // Prefer Stripe's amount for order estimate if available
  const estimateCents = Number.isInteger(price.unit_amount) ? price.unit_amount : plan.cents[billing];

  const pool = getPool();
  const db = await pool.connect();

  try {
    await db.query("BEGIN");
    const ins = await db.query(
      `INSERT INTO public.orders (id, client_id, total_cents, currency, status, source, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, 'usd', 'submitted', 'web-plan', NOW(), NOW())
       RETURNING id`,
      [client_id, estimateCents]
    );
    const order_id = ins.rows[0]?.id;
    if (!order_id) throw new Error("Failed to create order id");

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: price.id, quantity: 1 }],
      metadata: { client_id, order_id, plan_id, billing },
      success_url: `${siteBase}/payment-success?order_id=${order_id}&client_id=${encodeURIComponent(client_id)}`,
      cancel_url:  `${siteBase}/pricing`,
    });

    try {
      await db.query(
        `UPDATE public.orders SET stripe_session_id=$1, updated_at=NOW() WHERE id=$2`,
        [session.id, order_id]
      );
      await db.query(
        `INSERT INTO public.order_events (order_id, event_type, status, note)
         VALUES ($1,'status_update','submitted','stripe: subscription checkout created')`,
        [order_id]
      );
      await db.query("COMMIT");
    } catch (e) {
      try { await db.query("ROLLBACK"); } catch {}
      throw e;
    }

    return res.status(200).json({ ok: true, url: session.url, order_id });
  } catch (e) {
    console.error("create-plan-session error:", e?.message || e);
    return res.status(500).json({ error: "Internal Server Error" });
  } finally {
    db.release();
  }
}
