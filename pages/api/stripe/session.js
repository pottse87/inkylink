import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" });

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { id } = req.query; // Checkout session id (cs_...)
  if (!id) return res.status(400).json({ error: "Missing session id" });

  try {
    const session = await stripe.checkout.sessions.retrieve(id, {
      expand: ["line_items.data.price.product"],
    });

    const items = (session.line_items?.data ?? []).map((li) => {
      const price = li.price;
      const product = price?.product;
      const images = Array.isArray(product?.images) ? product.images : [];
      return {
        id: li.id,
        description: product?.name ?? li.description ?? "",
        quantity: li.quantity ?? 1,
        // convert cents -> dollars JUST for display
        unitAmount: price?.unit_amount != null ? price.unit_amount / 100 : null,
        currency: (price?.currency ?? session.currency ?? "usd").toUpperCase(),
        icon: images[0] ?? null,
        priceId: price?.id ?? null,
      };
    });

    res.status(200).json({
      id: session.id,
      paymentStatus: session.payment_status,
      amountTotal: session.amount_total != null ? session.amount_total / 100 : null, // dollars for display
      currency: (session.currency ?? "usd").toUpperCase(),
      customerEmail: session.customer_details?.email ?? null,
      items,
    });
  } catch (err) {
    console.error("Stripe session fetch failed:", err);
    res.status(400).json({ error: "Invalid or inaccessible session id" });
  }
}
