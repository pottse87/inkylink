"use client";
import React, { useEffect, useMemo, useState } from "react";
import { getClientId, ensureCidInUrl } from "../lib/client-id";

async function fetchCatalog() {
  const r = await fetch("/api/catalog");
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j?.error || "Failed to load catalog");
  return Array.isArray(j.items) ? j.items : [];
}

async function saveCart(client_id, items) {
  const r = await fetch("/api/save-cloud-cart", {
    method: "POST",
    headers: { "content-type": "application/json" },
    // merge so repeated adds increment/accumulate, not overwrite
    body: JSON.stringify({ client_id, items, mode: "merge" }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j?.error || "Failed to save cart");
  return j;
}

export default function PlansSection() {
  // Keep original clientId + URL behavior
  const clientId = useMemo(() => {
    try { return getClientId(); } catch { return null; }
  }, []);

  useEffect(() => { try { ensureCidInUrl(); } catch {} }, []);

  const [items, setItems] = useState(null);      // catalog products
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const list = await fetchCatalog();
        if (alive) setItems(list);
      } catch (e) {
        if (alive) setErr(e?.message || "Failed to load catalog");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  async function addToCart(product) {
    if (!clientId) return;
    setAddingId(product.id);
    try {
      await saveCart(clientId, [{
        id: product.id,
        name: product.name,
        description: product.description || "",
        price_cents: Number(product.price_cents) || 0,
        quantity: 1,
        icon: product.icon || "",
        stripe_price_id: product.stripe_price_id || null,
      }]);
      // Preserve your existing UX: after adding, go to confirmation
      window.location.href = `/confirmation?client_id=${encodeURIComponent(clientId)}`;
    } catch (e) {
      alert(e?.message || "Failed to add to cart");
    } finally {
      setAddingId(null);
    }
  }

  return (
    <section style={{ margin: "20px 0" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontSize: 22 }}>Products</h2>
        <div style={{ marginLeft: "auto", color: "#666", fontSize: 13 }}>
          Data live from your catalog — no auto add-ons
        </div>
      </div>

      {loading && (
        <div style={{ padding: 12, border: "1px dashed #ddd", borderRadius: 8 }}>
          Loading products…
        </div>
      )}

      {err && !loading && (
        <div style={{ padding: 12, border: "1px solid #f3c2c2", background: "#fff5f5", color: "#a30000", borderRadius: 8 }}>
          {err}
        </div>
      )}

      {!loading && !err && Array.isArray(items) && items.length === 0 && (
        <div style={{ padding: 12, border: "1px dashed #ddd", borderRadius: 8 }}>
          No products found. Add rows to <code>catalog_items</code>.
        </div>
      )}

      {!loading && !err && Array.isArray(items) && items.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 16 }}>
          {items.map(prod => (
            <div key={prod.id} style={{ border: "1px solid #eee", borderRadius: 12, padding: 16, background: "#fff" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {prod.icon ? (
                  <img src={prod.icon} alt="" width={28} height={28} />
                ) : (
                  <div style={{ width: 28, height: 28, background: "#eee", borderRadius: 6 }} />
                )}
                <strong>{prod.name}</strong>
              </div>

              {prod.description ? (
                <div style={{ marginTop: 6, color: "#555" }}>{prod.description}</div>
              ) : null}

              <div style={{ margin: "10px 0", fontSize: 28, fontWeight: 700 }}>
                ${((Number(prod.price_cents) || 0) / 100).toFixed(2)}
              </div>

              <button
                type="button"
                onClick={() => addToCart(prod)}
                disabled={!clientId || addingId === prod.id}
                aria-disabled={!clientId || addingId === prod.id}
                style={{
                  width: "100%", padding: "10px 14px", borderRadius: 10,
                  border: "1px solid #0fc24bff",
                  background: !clientId || addingId === prod.id ? "#999" : "#111",
                  color: "#fff",
                  cursor: !clientId || addingId === prod.id ? "not-allowed" : "pointer",
                  opacity: !clientId || addingId === prod.id ? 0.7 : 1,
                  transition: "transform 120ms ease, box-shadow 120ms ease",
                }}
                title={!clientId ? "Client ID not ready yet" : "Add to cart"}
              >
                {addingId === prod.id ? "Adding…" : "Add to Cart"}
              </button>
            </div>
          ))}
        </div>
      )}

      {!clientId && (
        <p style={{ marginTop: 12, color: "#a00" }}>
          Client ID is initializing. If buttons are disabled, try again in a moment or refresh.
        </p>
      )}
    </section>
  );
}
