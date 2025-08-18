import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { bundles, recurring } = req.body;

    if (!bundles || bundles.length === 0) {
      return res.status(400).json({ error: "No bundles provided" });
    }

    // Validate bundles array contents
    const line_items = bundles.map((bundle) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: bundle.name,
          description: bundle.description,
        },
        unit_amount: Math.round(bundle.price * 100),
        recurring: recurring
          ? {
              interval: "month",
            }
          : undefined,
      },
      quantity: bundle.quantity || 1,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: recurring ? "subscription" : "payment",
      line_items,
      success_url: `${req.headers.origin}/thankyou?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/pricing`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Error creating Stripe checkout session:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}


