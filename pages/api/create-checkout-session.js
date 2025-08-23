import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { bundles, client_id } = req.body;

    if (!bundles || bundles.length === 0) {
      return res.status(400).json({ error: "No bundles provided" });
    }

    if (!client_id) {
      return res.status(400).json({ error: "client_id is required" });
    }

    // Create order first
    const orderResponse = await fetch(`${req.headers.origin}/api/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ client_id, bundles })
    });

    if (!orderResponse.ok) {
      throw new Error("Failed to create order");
    }

    const { order_id } = await orderResponse.json();

    const line_items = bundles.map((bundle) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: bundle.name,
          description: bundle.description,
        },
        unit_amount: Math.round(bundle.price * 100),
      },
      quantity: bundle.quantity || 1,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items,
      metadata: {
        client_id: client_id,
        order_id: order_id
      },
      success_url: `${req.headers.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}&order_id=${order_id}&client_id=${client_id}`,
      cancel_url: `${req.headers.origin}/pricing`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Error creating Stripe checkout session:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
