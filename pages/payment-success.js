/* pages/payment-success.js
   Hallway pattern with a “bulletin board”:
   - Shows a minimal read-only order summary
   - Auto-redirects to /forms?order_id=…&client_id=… after ~1.8s
   - Manual link + <noscript> fallback
   - Supports ?session_id=… (Stripe metadata) or ?order_id/&client_id=… (sim)
   - Uses shared DB pool (lib/db.js), ESM, and no-store/noindex headers
*/
import { useEffect } from "react";
import { getPool } from "../lib/db.mjs";

const toUSD = (cents) => `$${(Number(cents || 0) / 100).toFixed(2)}`;
const isUuid = (s) =>
  typeof s === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);

export default function PaymentSuccess({ order, redirectTo, autoRedirectMs, error }) {
  // Auto-redirect shortly after showing the bulletin-board summary.
  useEffect(() => {
    if (redirectTo) {
      const t = setTimeout(() => {
        try {
          window.location.assign(redirectTo);
        } catch {}
      }, autoRedirectMs || 1800);
      return () => clearTimeout(t);
    }
  }, [redirectTo, autoRedirectMs]);

  const isProd = typeof process !== "undefined" && process.env.NODE_ENV === "production";

  return (
    <main
      style={{
        maxWidth: 900,
        margin: "40px auto",
        padding: "0 16px",
        fontFamily:
          'system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif',
      }}
    >
      <h1 style={{ fontSize: 32, margin: 0 }}>Payment Success</h1>

      {!isProd && (
        <p style={{ color: "#555", marginTop: 8 }}>
          Dev note: This page shows a brief order summary and then redirects to the intake
          form. Use the link below if auto-redirect doesn&apos;t fire.
        </p>
      )}

      <section
        style={{
          marginTop: 16,
          border: "1px solid #eee",
          borderRadius: 10,
          padding: 16,
          background: "#fafafa",
        }}
      >
        {error ? (
          <div style={{ color: "#c00" }}>{error}</div>
        ) : order ? (
          <>
            <div>
              <strong>Order ID:</strong> {order.id}
            </div>
            <div>
              <strong>Status:</strong> {order.status || "(unknown)"}
            </div>
            <div>
              <strong>Total:</strong> {toUSD(order.total_cents)}
            </div>
            {typeof order.items_count === "number" && (
              <div>
                <strong>Items:</strong> {order.items_count}
              </div>
            )}
            <p style={{ marginTop: 8, color: "#555" }}>
              You will be redirected to your intake form shortly.
            </p>
          </>
        ) : (
          <div style={{ color: "#c00" }}>Order not found.</div>
        )}
      </section>

      <div style={{ marginTop: 18 }}>
        {redirectTo ? (
          <a
            href={redirectTo}
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #0fc24b",
              background: "#111",
              color: "#fff",
              textDecoration: "none",
            }}
          >
            Continue to your form
          </a>
        ) : (
          <a
            href="/pricing"
            style={{
              padding: "10px 14px",
              borderRadius: 10,
              border: "1px solid #0fc24b",
              background: "#111",
              color: "#fff",
              textDecoration: "none",
            }}
          >
            Back to Pricing
          </a>
        )}
      </div>

      {/* No-JS fallback: visible link if scripts are disabled */}
      {redirectTo && (
        <noscript>
          <p>
            JavaScript is disabled.{" "}
            <a href={redirectTo}>Click here to open your intake form.</a>
          </p>
        </noscript>
      )}
    </main>
  );
}

// Server-side: resolve order/client, set safety headers, and provide minimal props
export async function getServerSideProps(ctx) {
  // Transactional safety headers
  ctx.res.setHeader("Cache-Control", "no-store, must-revalidate");
  ctx.res.setHeader("X-Robots-Tag", "noindex");

  const q = ctx.query || {};
  const sessionId = typeof q.session_id === "string" ? q.session_id : null;

  let orderId =
    typeof q.order_id === "string" && q.order_id.trim() ? q.order_id.trim() : null;
  let clientId =
    typeof q.client_id === "string" && q.client_id.trim() ? q.client_id.trim() : null;

  // Prefer tamper-resistant Stripe session in production if provided
  if (sessionId && process.env.STRIPE_SECRET_KEY) {
    try {
      // Dynamic import confines Stripe SDK to server only
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session && session.metadata) {
        orderId = session.metadata.order_id || orderId;
        clientId = session.metadata.client_id || clientId;
      }
    } catch (err) {
      console.error(
        JSON.stringify({
          event: "payment_success",
          step: "stripe_session_retrieve_failed",
          session: sessionId ? String(sessionId).slice(0, 8) + "…" : null,
          message: err?.message || String(err),
        })
      );
    }
  }

  // Validate order id shape before querying
  if (!orderId || !isUuid(orderId)) {
    return { redirect: { destination: "/pricing?r=ps_bad", permanent: false } };
  }

  try {
    const pool = await getPool();

    // Fetch minimal order fields (no PII)
    const ord = await pool.query(
      `select id, client_id, status, total_cents
         from public.orders
        where id = $1`,
      [orderId]
    );

    if (!ord.rows[0]) {
      return { redirect: { destination: "/pricing?r=ps_nf", permanent: false } };
    }

    // Resolve client_id if not provided
    if (!clientId) {
      clientId = ord.rows[0].client_id || null;
    }
    if (!clientId) {
      return { redirect: { destination: "/pricing?r=ps_nocid", permanent: false } };
    }

    // Optional: item count (best-effort; ignore if table not present)
    let itemsCount = null;
    try {
      const ic = await pool.query(
        `select count(*)::int as items_count
           from public.order_items
          where order_id = $1`,
        [orderId]
      );
      itemsCount = ic.rows?.[0]?.items_count ?? null;
    } catch {}

    const redirectTo = `/forms?order_id=${encodeURIComponent(
      orderId
    )}&client_id=${encodeURIComponent(clientId)}`;

    // Minimal props for the bulletin-board summary + redirect target
    return {
      props: {
        order: {
          id: ord.rows[0].id,
          status: ord.rows[0].status,
          total_cents: ord.rows[0].total_cents ?? 0,
          items_count: itemsCount,
        },
        redirectTo,
        autoRedirectMs: 1800,
        error: null,
      },
    };
  } catch (err) {
    console.error(
      JSON.stringify({
        event: "payment_success",
        step: "db_error",
        orderId,
        message: err?.message || String(err),
      })
    );
    // Soft-fail: redirect to pricing; avoids exposing stack to users
    return { redirect: { destination: "/pricing?r=ps_err", permanent: false } };
  }
}

