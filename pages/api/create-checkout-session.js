// pages/api/create-checkout-session.js

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { bundles } = req.body;

    const line_items = bundles.map(bundle => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: bundle.name,
          images: [`https://inkylink.com/icons/${bundle.id}.png`],
        },
        unit_amount: bundle.price * 100,
      },
      quantity: 1,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
      mode: "payment",
      success_url: `${req.headers.origin}/thankyou`,
      cancel_url: `${req.headers.origin}/confirmation`,
    });

    res.status(200).json({ sessionId: session.id });
  } catch (err) {
    console.error("Stripe error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}
