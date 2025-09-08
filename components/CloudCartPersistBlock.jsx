"use client";
import React from "react";

/** Non-cookie persistence for confirmation:
 *  Reads client_id (query → localStorage), fetches /api/get-cloud-cart,
 *  and shows the saved cart.
 */
export default function CloudCartPersistBlock({ footer }) {
  const [cid, setCid] = React.useState(null);
  const [items, setItems] = React.useState(null);
  const [busyId, setBusyId] = React.useState(null);
  const [clearing, setClearing] = React.useState(false);

  // Resolve client_id from query or localStorage and canonicalize URL
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const qs = new URLSearchParams(window.location.search);
    const fromQuery = qs.get("client_id");
    const fromLS = localStorage.getItem("inkylink_client_id") || null;
    const c = fromQuery || fromLS || null;
    setCid(c);

    if (!fromQuery && c) {
      qs.set("client_id", c);
      const next = `${window.location.pathname}?${qs.toString()}`;
      window.history.replaceState({}, "", next);
    }
  }, []);

  // Load cloud cart
  React.useEffect(() => {
    if (!cid) return;
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`/api/get-cloud-cart?client_id=${encodeURIComponent(cid)}`);
        const j = await r.json();
        if (!cancelled) setItems(Array.isArray(j?.items) ? j.items : []);
      } catch {
        if (!cancelled) setItems([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cid]);

  // Replace entire cart in DB
  async function saveCartReplace(next) {
    const r = await fetch("/api/save-cloud-cart", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ client_id: cid, items: next, mode: "replace" }),
    });
    const data = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(data?.error || `save-cloud-cart failed: ${r.status}`);
    return Array.isArray(data.items) ? data.items : [];
  }

  // Decrement one unit; remove if quantity hits 0
  async function handleRemove(idOrIndex) {
    if (!cid || !Array.isArray(items)) return;
    setBusyId(idOrIndex);
    try {
      const next = items
        .map((it, i) => {
          const key = typeof it.id !== "undefined" ? it.id : i;
          if (key !== idOrIndex) return it;
          const q = Math.max(1, Number(it.quantity) || 1) - 1;
          return q > 0 ? { ...it, quantity: q } : null;
        })
        .filter(Boolean);

      const newItems = await saveCartReplace(next);
      setItems(newItems);
    } catch {
      // no-op
    } finally {
      setBusyId(null);
    }
  }

  // Clear all items
  async function handleClear() {
    if (!cid || !Array.isArray(items) || items.length === 0) return;
    setClearing(true);
    try {
      const newItems = await saveCartReplace([]); // replace with empty cart
      setItems(newItems);
    } catch {
      // no-op
    } finally {
      setClearing(false);
    }
  }

  // Render once loaded, even if empty (to keep footer visible)
if (!Array.isArray(items)) return null;

  const total = items.reduce(
    (s, i) => s + (Number(i.price_cents) || 0) * (Number(i.quantity) || 0),
    0
  );

  return (
    <section style={{ margin: "16px 0", border: "1px dashed #ddd", borderRadius: 8, padding: 12 }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>Your saved cart</div>

  <div style={{ display: "flex", flexDirection: "column", gap: 8, margin: "6px 0 10px 0" }}>
  {items.length === 0 ? (
    <div style={{ padding: 16, border: "1px dashed #bbb", borderRadius: 8, textAlign: "center", color: "#555" }}>
      Your cart is empty.
    </div>
  ) : (
    items.map((it, idx) => {
      const qty = Math.max(1, Number(it.quantity) || 1);
      const price = Number(it.price_cents) || 0;
      const lineTotal = (price * qty) / 100;
      const key = typeof it.id !== "undefined" ? it.id : idx;
      const isBusy = busyId === key;
      const safeName =
        typeof it.name === "string" && it.name.trim() ? it.name.trim() : "Item";

      return (
        <div
          key={key}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 0",
            borderBottom: idx === items.length - 1 ? "none" : "1px solid #eee",
          }}
        >
         {/* left: icon + name/qty */}
<div style={{display:"flex", alignItems:"center", gap:10}}>
  {typeof it.icon === "string" && it.icon.trim() ? (
    <img
      src={it.icon}
      alt=""
      width={32}
      height={32}
      style={{ borderRadius: 6, objectFit: "cover", display: "block" }}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
    />
  ) : (
    <div style={{ width: 32, height: 32, background: "#eee", borderRadius: 6 }} />
  )}
  <div style={{display:"flex", flexDirection:"column"}}>
    <div style={{fontWeight:600}}>
      {(typeof it.name === "string" && it.name.trim()) ? it.name.trim() : "Item"}
    </div>
    <div style={{fontSize:12, color:"#666"}}>Qty: {qty}</div>
  </div>
</div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ minWidth: 80, textAlign: "right" }}>${lineTotal.toFixed(2)}</div>
            <button
              type="button"
              onClick={() => handleRemove(key)}
              disabled={isBusy}
              title="Remove (click again to decrement)"
              className="inkylink-remove-btn"
            >
              {isBusy ? "Removing…" : "Remove"}
            </button>
          </div>
        </div>
      );
    })
  )}
</div>

      {/* Total row */}
      <div style={{ display: "flex", justifyContent: "flex-end", paddingTop: 8, borderTop: "1px solid #eee" }}>
        <strong>Total: ${(total / 100).toFixed(2)}</strong>
      </div>

      {/* Controls row: Clear All (left) + footer slot (right) */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
        <button
          type="button"
          onClick={handleClear}
          disabled={clearing || busyId !== null || !items?.length}
          aria-disabled={clearing || busyId !== null || !items?.length}  // SAFETY: explicit aria state
          className="inkylink-clear-btn"
          title="Remove all items from your cart"
        >
          {clearing ? "Clearing…" : "Clear All"}
        </button>

        <div>{footer ? footer : null}</div>
      </div>

      <style jsx>{`
        .inkylink-remove-btn {
          padding: 6px 10px;
          border-radius: 6px;
          border: 1px solid #ddd;
          background: #fafafa;
          color: #111;
          cursor: pointer;
          transition: transform 120ms ease, box-shadow 120ms ease, background 120ms ease, color 120ms ease, border-color 120ms ease;
        }
        .inkylink-remove-btn:hover:not([disabled]) {
          background: #ffecec;
          color: #a30000;
          border-color: #f0c0c0;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .inkylink-remove-btn:active:not([disabled]) {
          transform: translateY(0);
          box-shadow: none;
        }
        .inkylink-remove-btn[disabled] {
          cursor: not-allowed;
          background: #eee;
          color: #999;
        }

        .inkylink-clear-btn {
          padding: 10px 14px;
          border-radius: 10px;
          border: 1px solid #ddd;
          background: #fff;
          color: #111;
          cursor: pointer;
          transition: transform 120ms ease, box-shadow 120ms ease, background 120ms ease, border-color 120ms ease;
        }
        .inkylink-clear-btn:hover:not([disabled]) {
          background: #fff7e6;
          border-color: #f3c27a;
          transform: translateY(-1px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .inkylink-clear-btn[disabled] {
          background: #eee;
          color: #999;
          cursor: not-allowed;
        }
      `}</style>
    </section>
  );
}
