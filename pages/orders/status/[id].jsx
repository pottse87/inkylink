/**
 * /orders/status/[id]
 * Public order status page (client-side fetch to /api/orders/get).
 * - No server-side rendering required
 * - Defensive loading/error states
 */

import { useEffect, useState } from "react";
import { useRouter } from "next/router";

function dollarsFromCents(cents, currency) {
  if (typeof cents !== "number") return "";
  const amount = cents / 100;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: (currency || "USD").toUpperCase(),
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

export default function OrderStatusPage() {
  const router = useRouter();
  const { id } = router.query;

  const [state, setState] = useState({ loading: true, error: "", data: null });

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    async function load() {
      setState({ loading: true, error: "", data: null });
      try {
        const res = await fetch(`/api/orders/get?id=${encodeURIComponent(id)}`);
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || `HTTP ${res.status}`);
        }
        const json = await res.json();
        if (!cancelled) setState({ loading: false, error: "", data: json });
      } catch (e) {
        if (!cancelled) setState({ loading: false, error: e.message || "Failed to load", data: null });
      }
    }

    load();
    return () => { cancelled = true; };
  }, [id]);

  if (!id) return <div style={{ padding: 24 }}>Missing order id in the URL.</div>;
  if (state.loading) return <div style={{ padding: 24 }}>Loading order…</div>;
  if (state.error) return <div style={{ padding: 24, color: "#b00020" }}>Error: {state.error}</div>;
  if (!state.data?.ok) return <div style={{ padding: 24 }}>Order not found.</div>;

  const { order, items } = state.data;
  const total = dollarsFromCents(order.total_cents, order.currency);

  return (
    <div style={{ padding: 24, maxWidth: 800, margin: "0 auto", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ margin: "0 0 8px" }}>Order Status</h1>
      <div style={{ color: "#666", marginBottom: 16 }}>Order ID: {order.id}</div>

      <div style={{
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 16,
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
        marginBottom: 16
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <div><strong>Status:</strong> {order.status}</div>
          <div><strong>Total:</strong> {total}</div>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", color: "#666" }}>
          <div>Created: {new Date(order.created_at).toLocaleString()}</div>
          <div>Updated: {new Date(order.updated_at).toLocaleString()}</div>
        </div>
      </div>

      <h2 style={{ margin: "16px 0 8px" }}>Items</h2>
      <div>
        {(items || []).length === 0 ? (
          <div style={{ color: "#666" }}>No items found on this order.</div>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {items.map((it, i) => (
              <li key={i} style={{
                border: "1px solid #e5e7eb",
                borderRadius: 12,
                padding: 12,
                marginBottom: 8
              }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div style={{ fontWeight: 600 }}>{it.name || it.item_id}</div>
                  <div>{dollarsFromCents(it.price_cents, order.currency)} × {it.quantity}</div>
                </div>
                {it.description ? (
                  <div style={{ color: "#555", marginTop: 6 }}>{it.description}</div>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
