// pages/api/create-checkout-session.js
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  console.log("▶️ METHOD:", req.method); // <-- ADD
  console.log("▶️ BODY:", req.body); // <-- ADD

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { bundles, recurring } = req.body;

    if (!bundles || !Array.isArray(bundles)) {
      console.log("⛔ INVALID BUNDLES:", bundles);
      return res.status(400).json({ error: "Missing or invalid bundles array." });
    }

    const line_items = bundles.map((bundle) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: bundle.name,
          description: bundle.description,
        },
        unit_amount: Math.round(bundle.price * 100),
        recurring: recurring ? { interval: "month" } : undefined,
      },
      quantity: bundle.quantity || 1,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: recurring ? "subscription" : "payment",
      success_url: `${req.headers.origin}/thank-you`,
      cancel_url: `${req.headers.origin}/pricing`,
    });

    console.log("✅ Session created:", session.id); // <-- ADD
    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("🔥 STRIPE ERROR:", err); // <-- ADD
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
