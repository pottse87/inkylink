import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import CloudCartPersistBlock from "../components/CloudCartPersistBlock";
import { ensureCidInUrl, getClientId } from '../lib/client-id';
const fmt = (c) => `$${(Number(c||0)/100).toFixed(2)}`;
const sum = (arr, f) => arr.reduce((s,x)=>s+f(x),0);

function IncludedList({items}) {
  if (!items?.length) return null;
  return (
    <ul style={{margin:"8px 0 0 18px", color:"#555"}}>
      {items.map((it,i)=><li key={i}>{it.name} × {it.quantity}</li>)}
    </ul>
  );
}

export default function Confirmation({ serverClientId, cartItems }) {
  React.useEffect(() => { ensureCidInUrl(); }, []);
  const router = useRouter();
  const [items, setItems] = useState(cartItems || []);
  const client_id = serverClientId;

// Snapshot: persist latest cart to localStorage (NO auto-restore)
useEffect(() => {
  try {
    const key = "inkylink_last_cart";
    if (Array.isArray(items) && items.length > 0) {
      localStorage.setItem(key, JSON.stringify(items));
    } else {
      // optional: clear stale cache so old add-ons can't come back later
      // localStorage.removeItem(key);
    }
  } catch {}
}, [items?.length]);


  if (!client_id) {
    return (
      <main style={{maxWidth:900,margin:"40px auto",padding:"0 16px",fontFamily:"system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif"}}>
        <h1>Review &amp; Submit</h1>
        <div style={{color:"#c00"}}>Missing <code>client_id</code>.</div>
        <div style={{marginTop:12}}><a href="/pricing">Back to Pricing</a></div>
      <_CidAttachHook />
<CloudCartPersistBlock />
</main>
    );
  }

  const total = sum(items, (it) => (Number(it.price_cents)||0) * Math.max(1, Number(it.quantity)||1));
  const plan = null; // forced off to hide plan summary block
const included = false /* plan block removed */ ? items.filter(x => x !== plan) : [];

  const goCheckout = async () => {
    try {
      const r = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ client_id })
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Failed to start checkout");
      if (data?.url) window.location.href = data.url;
      else alert("Stripe disabled / no URL returned.");
    } catch (e) {
      alert(e.message || "Checkout failed");
    }
  };

  return (
    <main style={{maxWidth:900,margin:"40px auto",padding:"0 16px",fontFamily:"system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif"}}>
      <h1>Review &amp; Submit</h1>
        <_CidAttachHook />
<CloudCartPersistBlock
  footer={
    <div style={{display:"flex", justifyContent:"flex-end", gap:8}}>
      <button
        onClick={()=>router.push("/pricing")}
        style={{padding:"10px 14px",borderRadius:8,border:"1px solid #ddd",background:"#111",color:"#fff",cursor:"pointer"}}
      >
        Back to Pricing
      </button>
      <button
        onClick={goCheckout}
        disabled={items.length===0}
        style={{padding:"10px 14px",borderRadius:8,border:"1px solid #0fc24bff",background:"#0fc24bff",color:"#fff",cursor:items.length===0?"not-allowed":"pointer",opacity:items.length===0?0.7:1}}
      >
        Proceed to Checkout
      </button>
    </div>
  }
/>

</main>
  );
}

// ---- SSR: read cart by client_id from query OR cookie (PGSSLMODE-aware)
export async function getServerSideProps(ctx) {
  let client_id = ""; // make available in catch/fallbacks

  try {
    const cookieHeader = ctx.req.headers.cookie || "";
    const cookies = Object.fromEntries(
      cookieHeader
        .split(/;\s*/).filter(Boolean)
        .map(kv => {
          const i = kv.indexOf("=");
          if (i < 0) return [kv, ""];
          return [decodeURIComponent(kv.slice(0, i)), decodeURIComponent(kv.slice(i + 1))];
        })
    );

    const q = ctx.query || {};
    client_id = String(q.client_id || cookies["inkylink_client_id"] || "");

    const cs = process.env.DATABASE_URL;
    if (!cs || !client_id) {
      console.log("[CONFIRMATION_SSR_DIAG] missing client_id or DATABASE_URL; client_id=%s", client_id || "<none>");
      return { props: { serverClientId: client_id || null, cartItems: [] } };
    }

    const { Pool } = await import("pg");
    const pool = new Pool({
      connectionString: cs,
      ssl: (process.env.PGSSLMODE === "disable" || process.env.DB_SSL === "0" || process.env.DB_SSL === "false")
        ? false
        : { rejectUnauthorized: false }
    });

    const db = await pool.connect();
    try {
      const r = await db.query("SELECT items FROM public.carts WHERE client_id=$1", [client_id]);
      const items = Array.isArray(r.rows?.[0]?.items) ? r.rows[0].items : [];
      console.log("[CONFIRMATION_SSR_DIAG] client_id=%s items_len=%d", client_id, Array.isArray(items) ? items.length : -1);
      return { props: { serverClientId: client_id, cartItems: items } };
    } finally {
      db.release();
      await pool.end();
    }
  } catch (e) {
    console.error("confirmation SSR error:", e?.message || e);
    return { props: { serverClientId: client_id || null, cartItems: [] } };
  }
}

function _CidAttachHook(){
  const router = useRouter();
  useEffect(() => {
    if (!router?.isReady) return;
    const hasCid = typeof router.query?.client_id === 'string' && router.query.client_id.length > 0;
    if (hasCid) return;
    if (typeof window === 'undefined') return;
    const cid = localStorage.getItem('inkylink_client_id');
    if (cid) {
      const nextQuery = { ...router.query, client_id: cid };
      router.replace({ pathname: router.pathname, query: nextQuery }, undefined, { shallow: false });
    }
  }, [router?.isReady]);
  return null;
}








