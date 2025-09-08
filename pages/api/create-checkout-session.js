import Stripe from "stripe";
import { getPool } from "../../lib/db.mjs";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
const STRIPE_ENABLED = /^sk_/.test(STRIPE_SECRET_KEY);
const stripe = STRIPE_ENABLED ? new Stripe(STRIPE_SECRET_KEY) : null;

function dollarsToCents(x) {
  const n = Number(x);
  if (!Number.isFinite(n) || n < 0) throw new Error(`Invalid price: ${x}`);
  return Math.round(n * 100);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { bundles, client_id } = req.body || {};
  if (!client_id || typeof client_id !== "string") {
    return res.status(400).json({ error: "client_id is required" });
  }
  if (!process.env.DATABASE_URL) {
    return res.status(500).json({ error: "DATABASE_URL not configured" });
  }

  const pool = getPool();
  const db = await pool.connect();

  try {
    // Load items from cloud cart; fall back to request bundles
    let items = [];
    try {
      const cart = await db.query(
        "SELECT items FROM public.carts WHERE client_id=$1",
        [client_id]
      );
      if (Array.isArray(cart?.rows?.[0]?.items)) {
        items = cart.rows[0].items;
      }
    } catch {
      // ignore (missing table/row etc.) and use bundles fallback
    }

    if (items.length === 0 && Array.isArray(bundles)) {
      items = bundles.map((b) => ({
        id: String(b.id ?? b.name ?? "item"),
        name: String(b.name ?? b.title ?? b.id),
        description: b.description ? String(b.description) : "",
        price_cents: dollarsToCents(b.price),
        quantity: Math.max(1, Math.floor(Number(b.quantity) || 1)),
        kind: b.kind || b.type || undefined,
        plan_id: b.plan_id || undefined,
        stripe_price_id: b.stripe_price_id || undefined,
        billing: b.billing || undefined,
      }));
    }

    const inferredOrigin =
      (req.headers.origin && String(req.headers.origin)) ||
      (req.headers["x-forwarded-proto"]
        ? `${req.headers["x-forwarded-proto"]}://${req.headers.host}`
        : `https://${req.headers.host || "localhost:3000"}`);

    // ===== SUBSCRIPTION BRANCH (if any plan-like item exists) =====
    const plan =
      items.find(
        (i) => i?.kind === "plan" || i?.type === "plan" || i?.plan_id
      ) || null;

    if (plan) {
      if (!STRIPE_ENABLED) {
        return res
          .status(500)
          .json({ error: "Stripe not configured for subscriptions" });
      }

      const billing = plan.billing === "yearly" ? "yearly" : "monthly";
      const priceId = plan.stripe_price_id || null;
      const estTotal = Number(plan.price_cents) || 0;

      if (!priceId) {
        return res
          .status(400)
          .json({ error: "Plan selected but missing stripe_price_id" });
      }

      await db.query("BEGIN");
      try {
        const ins = await db.query(
          `INSERT INTO public.orders (id, client_id, total_cents, currency, status, source, created_at, updated_at)
           VALUES (gen_random_uuid(), $1, $2, 'usd', 'submitted', 'web-plan', NOW(), NOW())
           RETURNING id`,
          [client_id, estTotal]
        );
        const order_id = ins.rows?.[0]?.id;
        if (!order_id) throw new Error("Failed to create order id");

        // Save any included items for recordkeeping
        for (const r of items.filter((x) => x !== plan)) {
          await db.query(
            `INSERT INTO public.order_items (order_id, item_id, name, price_cents, quantity, meta)
             VALUES ($1,$2,$3,$4,$5,$6::jsonb)`,
            [
              order_id,
              String(r.id || "inc"),
              String(r.name || "Included"),
              Math.max(0, Number(r.price_cents) || 0),
              Math.max(1, Math.floor(Number(r.quantity) || 1)),
              JSON.stringify({ included: true, description: r.description || "" }),
            ]
          );
        }

        const session = await stripe.checkout.sessions.create({
          mode: "subscription",
          payment_method_types: ["card"],
          line_items: [{ price: priceId, quantity: 1 }],
          metadata: {
            client_id,
            order_id,
            plan_id: String(plan.plan_id || plan.id || "plan"),
            billing,
          },
          success_url: `${inferredOrigin}/payment-success?order_id=${order_id}&client_id=${encodeURIComponent(
            client_id
          )}`,
          cancel_url: `${inferredOrigin}/pricing`,
        });

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

        return res.status(200).json({ ok: true, url: session.url, order_id });
      } catch (e) {
        try {
          await db.query("ROLLBACK");
        } catch {}
        throw e;
      }
    }

    // ===== ONE-TIME PAYMENT BRANCH =====
    const ids = [...new Set(items.map((i) => String(i.id)))];
    let resolved = items;

    try {
      if (ids.length > 0) {
        const cat = await db.query(
          `SELECT id, title, price_cents, stripe_price_id
             FROM public.catalog_items
            WHERE id = ANY($1::text[])`,
          [ids]
        );
        const byId = new Map(cat.rows.map((r) => [String(r.id), r]));
        resolved = items.map((i) => {
          const c = byId.get(String(i.id));
          return {
            id: String(i.id),
            name: c?.title || String(i.name || i.title || i.id),
            description: i.description ? String(i.description) : "",
            price_cents:
              (c && Number(c.price_cents)) ||
              Math.max(0, Number(i.price_cents) || 0),
            quantity: Math.max(1, Math.floor(Number(i.quantity) || 1)),
            stripe_price_id: c?.stripe_price_id || i.stripe_price_id || null,
          };
        });
      }
    } catch {
      // If catalog lookup fails, proceed with given items
      resolved = items.map((i) => ({
        id: String(i.id),
        name: String(i.name || i.title || i.id),
        description: i.description ? String(i.description) : "",
        price_cents: Math.max(0, Number(i.price_cents) || 0),
        quantity: Math.max(1, Math.floor(Number(i.quantity) || 1)),
        stripe_price_id: i.stripe_price_id || null,
      }));
    }

    const total = resolved.reduce(
      (s, r) => s + Number(r.price_cents || 0) * Number(r.quantity || 1),
      0
    );

    let order_id;
    await db.query("BEGIN");
    try {
      const ins = await db.query(
        `INSERT INTO public.orders (id, client_id, total_cents, currency, status, source, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, 'usd', 'submitted', 'web', NOW(), NOW())
         RETURNING id`,
        [client_id, total]
      );
      order_id = ins.rows?.[0]?.id;
      if (!order_id) throw new Error("Failed to create order id");

      for (const r of resolved) {
        await db.query(
          `INSERT INTO public.order_items (order_id, item_id, name, price_cents, quantity, meta)
           VALUES ($1,$2,$3,$4,$5,$6::jsonb)`,
          [
            order_id,
            r.id,
            r.name,
            r.price_cents,
            r.quantity,
            JSON.stringify({ description: r.description || "" }),
          ]
        );
      }
      await db.query("COMMIT");
    } catch (e) {
      try {
        await db.query("ROLLBACK");
      } catch {}
      throw e;
    }

    if (!STRIPE_ENABLED) {
      return res
        .status(200)
        .json({ ok: true, order_id, stripe: "disabled", url: null });
    }

    const line_items = resolved.map((r) =>
      r.stripe_price_id
        ? { price: r.stripe_price_id, quantity: r.quantity }
        : {
            price_data: {
              currency: "usd",
              product_data: {
                name: r.name,
                description: r.description || undefined,
              },
              unit_amount: r.price_cents,
            },
            quantity: r.quantity,
          }
    );

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items,
      metadata: { client_id, order_id },
      success_url: `${inferredOrigin}/payment-success?order_id=${order_id}&client_id=${encodeURIComponent(
        client_id
      )}`,
      cancel_url: `${inferredOrigin}/pricing`,
    });

    try {
      await db.query(
        `UPDATE public.orders SET stripe_session_id=$1, updated_at=NOW() WHERE id=$2`,
        [session.id, order_id]
      );
    } catch {}

    return res.status(200).json({ ok: true, url: session.url, order_id });
  } catch (err) {
    console.error("create-checkout-session error:", err?.message || err);
    return res.status(500).json({ error: "Internal Server Error" });
  } finally {
    try { db.release(); } catch {}
  }
}

