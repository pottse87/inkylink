import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
// client helpers
const isBrowser = () => typeof window !== "undefined";
const toUSD = (cents) => `$${(Number(cents||0)/100).toFixed(2)}`;
const displayName = (x) => (x?.name ?? x?.title ?? "").toString();

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
    // removed: client_id is managed by lib/client-id
  }
  return cid;
};

async function saveCart(client_id, items) {
  const r = await fetch("/api/save-cloud-cart", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ client_id, items })
  });
  const data = await r.json().catch(()=>({}));
  if (!r.ok) throw new Error(data?.error || "Failed to save cart");
  return data;
}

export default function Pricing({ catalog=[] }) {
  const router = useRouter();
  const [clientId, setClientId] = useState(null);
  const [qty, setQty] = useState({}); // id -> quantity

  useEffect(() => { setClientId(getClientId()); }, []);

  const items = (Array.isArray(catalog)?catalog:[]).map(r => ({
    id: String(r.id),
    title: displayName(r) || String(r.title || r.id),
    description: r.description || "",
    icon: r.icon || "",
    price_cents: Number(r.price_cents) || 0
  }));

  const inc = (id) => setQty((q)=>({ ...q, [id]: Math.max(1,(q[String(id)]||0)+1)}));
  const dec = (id) => setQty((q)=>{ const n=Math.max(0,(q[String(id)]||0)-1); const c={...q}; if(n<=0) delete c[id]; else c[id]=n; return c; });

  const selected = items.filter(i => (qty[String(i.id)]||0) > 0);
  const total = selected.reduce((s,i)=> s + i.price_cents * (qty[String(i.id)]||0), 0);

  const review = async () => {
    if (!clientId) return;
    if (selected.length === 0) { alert("Pick at least one item."); return; }
    const cart = selected.map(i => ({
      id: i.id, name: i.title, description: i.description, icon: i.icon,
      price_cents: i.price_cents, quantity: Math.max(1, Math.floor(qty[String(i.id)]||1))
    }));
    console.log("[PRICING_SAVE]", "client_id=", clientId, "items=", cart); await saveCart(clientId, cart);
    router.push(`/confirmation?client_id=${clientId}`);
  };

  return (
   <main style={{maxWidth:1100,margin:"40px auto",padding:"2rem",fontFamily:"Lato, sans-serif",backgroundColor:"#a5f1f5ff",color:"#0b0f0a",minHeight:"100vh"}}>
     <div style={{ textAlign: "center", marginBottom: 8 }}>
  <h1 style={{ fontSize: 32, margin: "0 0 4px 0" }}>Pricing</h1>
  <div style={{ fontSize: 12, color: "#777" }}>
    Catalog items: {items.length}
  </div>
</div>

                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",columnGap:34,rowGap:42,alignItems:"stretch"}}>
        {items.map(it=>{
          const q = qty[String(it.id)]||0;
          return (
                <div key={it.id} className="il-card-wrap" style={{ paddingBottom: 0 }}>
            <div
              className="il-card" tabIndex={0}
              style={{
                border:"1px solid #e3cfa6",
                background:"#ffedd6",
                borderRadius:12,
                padding:16,
                display:"flex",
                flexDirection:"column",
                height:"100%"
              }}
            >
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                {it.icon ? <img src={it.icon} width={28} height={28} alt="" /> : <div style={{width:28,height:28,background:"#eee",borderRadius:6}}/>}
                <strong>{it.title}</strong>
              </div>
              <p className="il-desc" style={{color:"#555", margin:"8px 0 0 0"}}>{it.description}</p>
              <div style={{flexGrow:1}} />
              <div style={{margin:"8px 0",fontWeight:700}}>{toUSD(it.price_cents)}</div>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <button onClick={()=>dec(it.id)} style={{width:34,height:34,borderRadius:8,border:"1px solid #ddd",background:"#111",color:"#fff"}}>-</button>
                <div style={{minWidth:28,textAlign:"center"}}>{q}</div>
                <button onClick={()=>inc(it.id)} style={{width:34,height:34,borderRadius:8,border:"1px solid #ddd",background:"#111",color:"#fff"}}>+</button>
              </div>
            </div>
          </div>

          );
        })}
      </div>

    <div style={{display:"flex", justifyContent:"flex-end", alignItems:"center", gap:12, marginTop:18}}>
  <div style={{fontWeight:700}}>Selected total: {toUSD(total)}</div>
  <button
    onClick={review}
    style={{padding:"10px 14px",borderRadius:10,border:"1px solid #0fc24bff",background:"#111",color:"#fff",cursor:"pointer"}}
  >
    Review & Submit
  </button>
</div>
    <style jsx>{`
      .il-card {
        transform: translateY(0);
        transition: transform 140ms ease, box-shadow 140ms ease;
        will-change: transform;
      }
      .il-card:hover,
      .il-card:focus-within {
        transform: translateY(-4px);
        box-shadow: 0 10px 24px rgba(0,0,0,0.18);
        position: relative;
        z-index: 1;
      }
      /* New: remove default focus outline (we already elevate on focus) */
      .il-card:focus { outline: none; }

      .il-desc {
        display: -webkit-box;
        -webkit-line-clamp: 3;           /* show 3 lines by default */
        -webkit-box-orient: vertical;
        overflow: hidden;
        max-height: 4.6em;               /* ~3 lines */
        transition: max-height 160ms ease;
        word-break: break-word;          /* New: prevent overflow on long words/URLs */
      }
      .il-card:hover .il-desc,
      .il-card:focus-within .il-desc {
        -webkit-line-clamp: unset;       /* expand */
        max-height: 200vh;               /* allow growth */
      }
    `}</style>
    </main> 
  );
}

// SSR: load catalog from DB (PGSSLMODE-aware)
export async function getServerSideProps() {
  try {
    const { Pool } = await import("pg");
    const cs = process.env.DATABASE_URL;
    if (!cs) return { props: { catalog: [] } };
    const pool = new Pool({
      connectionString: cs,
      ssl: (process.env.PGSSLMODE==="disable"||process.env.DB_SSL==="0"||process.env.DB_SSL==="false") ? false : { rejectUnauthorized:false }
    });
    const db = await pool.connect();
    try {
      const r = await db.query("SELECT id,title,description,icon,price_cents FROM public.catalog_items ORDER BY title ASC");
      const catalog = r.rows.map(x=>({
        id: String(x.id ?? ""), title: String(x.title ?? ""), name: String(x.title ?? ""), description: String(x.description ?? ""), icon: String(x.icon ?? ""), price_cents: Number(x.price_cents ?? 0) || 0
      }));
      return { props: { catalog } };
    } finally { db.release(); await pool.end(); }
  } catch(e) {
    console.error("pricing SSR error:", e?.message || e);
    return { props: { catalog: [] } };
  }
}




