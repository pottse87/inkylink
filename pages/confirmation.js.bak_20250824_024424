import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";

const isBrowser = () => typeof window !== "undefined";
const getClientId = () => {
  if (!isBrowser()) return null;
  let cid = localStorage.getItem("inkylink_client_id");
  if (!cid) {
    try {
      cid = ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
      );
    } catch {
      cid = `cid_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    }
    localStorage.setItem("inkylink_client_id", cid);
  }
  return cid;
};

async function apiGetCloudCart(client_id) {
  const r = await fetch(`/api/get-cloud-cart?client_id=${encodeURIComponent(client_id)}`);
  if (!r.ok) throw new Error(`get-cloud-cart failed: ${r.status}`);
  return r.json();
}

async function apiSaveCloudCart(client_id, items, mode = "merge") {
  const r = await fetch("/api/save-cloud-cart", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ client_id, items, mode })
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.error || `save-cloud-cart failed: ${r.status}`);
  return data;
}

async function apiCheckout(client_id, session_id) {
  const r = await fetch("/api/checkout", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ client_id, session_id })
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.error || `checkout failed: ${r.status}`);
  return data;
}

export default function ConfirmationPage() {
  const router = useRouter();
  const [clientId, setClientId] = useState(null);
  const [mounted, setMounted] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checkoutStatus, setCheckoutStatus] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [clearing, setClearing] = useState(false);

  // Fix SSR hydration
  useEffect(() => {
    setMounted(true);
    setClientId(getClientId());
  }, []);

  // Load cart only after client-side mount
  useEffect(() => {
    if (!mounted || !clientId) return;
    
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const data = await apiGetCloudCart(clientId);
        if (!alive) return;
        setItems(Array.isArray(data.items) ? data.items : []);
        setError(null);
      } catch (e) {
        if (!alive) return;
        setError(e.message || "Failed to load cart");
      } finally {
        alive && setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [mounted, clientId]);

  // Handle Stripe return
  useEffect(() => {
    if (!mounted || !clientId) return;
    const session_id = typeof router.query.session_id === "string" ? router.query.session_id : null;
    if (!session_id) return;

    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const data = await apiCheckout(clientId, session_id);
        if (!alive) return;
        setCheckoutStatus(data);
        setError(null);
      } catch (e) {
        if (!alive) return;
        setError(e.message || "Checkout failed");
      } finally {
        alive && setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [mounted, clientId, router.query.session_id]);

  const totalCents = useMemo(
    () => items.reduce((sum, it) => sum + (Number(it.price_cents) || 0) * (Number(it.quantity) || 1), 0),
    [items]
  );

  const handleRemove = async (id) => {
    if (!clientId) return;
    setBusyId(id);
    try {
      const next = items
        .map(it => {
          if (it.id === id) {
            const newQty = (Number(it.quantity) || 1) - 1;
            if (newQty > 0) {
              return { ...it, quantity: newQty };
            }
            return null;
          }
          return it;
        })
        .filter(Boolean);

      await apiSaveCloudCart(clientId, [], "replace");
      const res = await apiSaveCloudCart(clientId, next, "replace");
      setItems(Array.isArray(res.items) ? res.items : []);
      setError(null);
    } catch (e) {
      setError(e.message || "Remove failed");
    } finally {
      setBusyId(null);
    }
  };

  const handleClear = async () => {
    if (!clientId) return;
    setClearing(true);
    try {
      const res = await apiSaveCloudCart(clientId, [], "replace");
      setItems(res.items || []);
      setError(null);
    } catch (e) {
      setError(e.message || "Clear failed");
    } finally {
      setClearing(false);
    }
  };

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return <div style={{ padding: 24 }}>Loading...</div>;
  }

  return (
    <main style={{ maxWidth: 900, margin: "40px auto", padding: "0 16px", fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: 8 }}>Order Confirmation</h1>
      <p style={{ color: "#555", marginBottom: 16 }}>Review your items below. If you just paid with Stripe, we'll finalize your order automatically.</p>

      {error && (
        <div style={{ background: "#ffe8e8", border: "1px solid #f5b5b5", padding: 12, borderRadius: 8, marginBottom: 12 }}>
          {String(error)}
        </div>
      )}

      {checkoutStatus && (
        <div style={{ background: "#e7f8ee", border: "1px solid #b7e2c9", padding: 12, borderRadius: 8, marginBottom: 12 }}>
          <strong>Order received.</strong><br/>
          Order ID: {checkoutStatus.order_id}<br/>
          Status: {checkoutStatus.status}<br/>
          Total: ${(checkoutStatus.total_cents/100).toFixed(2)}
        </div>
      )}

      {loading ? (
        <div>Loading…</div>
      ) : items.length === 0 ? (
        <div style={{ padding: 24, border: "1px dashed #bbb", borderRadius: 12, textAlign: "center" }}>
          Your cart is empty.
        </div>
      ) : (
        <>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {items.map((it) => {
              const isBusy = busyId === it.id || clearing;
              return (
                <li
                  key={it.id}
                  style={{ display: "flex", alignItems: "center", gap: 12, padding: 12, borderBottom: "1px solid #eee" }}
                >
                  {it.icon ? (
                    <img src={it.icon} alt="" width={32} height={32} />
                  ) : (
                    <div style={{ width: 32, height: 32, background: "#eee", borderRadius: 6 }} />
                  )}

                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: 8 }}>
                      <span>{it.name}</span>
                      <span
                        style={{
                          fontSize: 12,
                          background: "#eef2ff",
                          color: "#3730a3",
                          border: "1px solid #e5e7eb",
                          padding: "2px 6px",
                          borderRadius: 999
                        }}
                      >
                        Qty: {it.quantity || 1}
                      </span>
                    </div>
                    {it.description ? <div style={{ color: "#666", fontSize: 14 }}>{it.description}</div> : null}
                  </div>

                  <div style={{ fontWeight: 700 }}>
                    {"$" + (((Number(it.price_cents) || 0) * (Number(it.quantity) || 1)) / 100).toFixed(2)}
                  </div>

                  <button
                    onClick={() => handleRemove(it.id)}
                    disabled={isBusy}
                    style={{
                      marginLeft: 12,
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "1px solid #ddd",
                      background: isBusy ? "#eee" : "#fafafa",
                      color: "#111",
                      cursor: isBusy ? "not-allowed" : "pointer"
                    }}
                  >
                    {busyId === it.id ? "Removing…" : "Remove"}
                  </button>
                </li>
              );
            })}
          </ul>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
            <button
              onClick={handleClear}
              disabled={clearing || busyId !== null || loading}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid #ddd",
                background: (clearing || busyId !== null || loading) ? "#eee" : "#fff",
                color: "#111",
                cursor: (clearing || busyId !== null || loading) ? "not-allowed" : "pointer"
              }}
              title="Clear all items"
            >
              {clearing ? "Clearing…" : "Clear All"}
            </button>

            <div style={{ fontSize: 18 }}>
              <strong>{"Total: $" + (totalCents / 100).toFixed(2)}</strong>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
