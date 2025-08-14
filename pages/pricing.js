import ROICalculator from "../components/ROICalculator";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";

//  helpers  //
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

async function saveCart(client_id, items) {
  const r = await fetch("/api/save-cloud-cart", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ client_id, items })
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.error || "Failed to save cart");
  return data;
}

const displayName = (p) => (p?.name ?? p?.title ?? "").toString();

const n = (v) => {
  if (typeof v === "number") return Math.max(0, Math.floor(v));
  if (typeof v === "string") {
    const m = v.match(/\d+/);
    return m ? Math.max(0, parseInt(m[0], 10)) : 0;
  }
  return 0;
};

// Pricing helpers
const formatUSD = (v) => {
  const num = Number(v);
  if (!Number.isFinite(num)) return "$0.00";
  return `$${num.toFixed(2)}`;
};

const planPrice = (p, freq) =>
  freq === "yearly"
    ? (Number.isFinite(p?.priceYearly) ? p.priceYearly : (Number(p?.priceMonthly) || 0) * 12)
    : (Number(p?.priceMonthly) || 0);

const planSavings = (p) =>
  (Number(p?.priceMonthly) || 0) * 12 - (Number(p?.priceYearly) || 0);


// Map plan counters -> catalog ids
function expandSubscriptionPlan(plan) {
  const out = [];
  const push = (id, qty) => { if (id && qty > 0) out.push({ id, name: "", description: "", icon: "", quantity: qty }); };

  // counters supported by your plan objects
  push("product description",        n(plan.productDescriptions));
  push("product overview",           n(plan.productOverview));
  push("bullet point rewrite",       n(plan.bulletRewrites));
  push("welcome email",              n(plan.welcomeEmail));
  push("seo titles metadata",        n(plan.seoMetadata));
  push("seo blog post",              n(plan.blog));
  push("product drop email",         n(plan.email));
  push("comparison table",           n(plan.extra));
  push("faq section",                n(plan.faq));

  return out;
}

const plans = [
  { id: "starter", name: "Starter Plan", description: "Streamlined precision with a professional edge.", priceMonthly: 69, priceYearly: 699, stripeMonthlyId: "price_1RrASOFjDGmKohCH3emQcGkw", stripeYearlyId: "price_1RrAWzFjDGmKohCHaTwI70lD", icon: "/icons/starter.png", productDescriptions: 1, productOverview: 2, bulletRewrites: 1, welcomeEmail: 1, color: "#e8f5e9" },
  { id: "growth", name: "Growth Plan", description: "Content that scales as fast as your catalog.", priceMonthly: 129, priceYearly: 1299, stripeMonthlyId: "price_1RrAZCFjDGmKohCHxEnUiiHn", stripeYearlyId: "price_1RrAa2FjDGmKohCHOnxsKpAJ", icon: "/icons/growth.png", productDescriptions: 3, productOverview: 3, bulletRewrites: 2, welcomeEmail: 1, seoMetadata: 2, color: "#e3f2fd" },
  { id: "pro", name: "Pro Plan", description: "Strategic content development tailored to established names.", priceMonthly: 229, priceYearly: 2299, stripeMonthlyId: "price_1RrAcJFjDGmKohCHEzzR4KF7", stripeYearlyId: "price_1RrAdjFjDGmKohCHwYxagpG4", icon: "/icons/pro.png", productDescriptions: 5, productOverview: 5, bulletRewrites: 3, seoMetadata: 2, welcomeEmail: 2, blog: "1 blog post", faq: "1 FAQ section", revisions: "Up to 2 revisions per item/month", color: "#ede7f6" },
  { id: "elite", name: "Elite Plan", description: "Consistent monthly content to match your business velocity.", priceMonthly: 329, priceYearly: 3299, stripeMonthlyId: "price_1RrAfJFjDGmKohCHuZ3dZPUs", stripeYearlyId: "price_1RrAglFjDGmKohCHmVeQg6YC", icon: "/icons/elite.png", productDescriptions: 15, productOverview: 3, bulletRewrites: 5, seoMetadata: 4, welcomeEmail: 2, blog: "1 blog post", email: "1 email campaign", extra: "1 comparison table", faq: "1 FAQ section", revisions: "Up to 2 revisions per item/ month ", color: "#fff3e0" },
];

// data (your products/plans, cleaned)
const oneTimeProducts = [
  { id: "product description", title: "Product Description", price: 39, description: "Stand out in search with expertly crafted product descriptions.", icon: "/icons/desc.png", stripeMonthlyId: "price_1RrAiGFjDGmKohCHv5acUOmw" },
  { id: "product overview", title: "Product Overview", price: 29, description: "Highlight your product in a quick, easy-to-read snapshot.", icon: "/icons/overview.png", stripeMonthlyId: "price_1RrAkaFjDGmKohCHFah1gFHG" },
  { id: "welcome email", title: "Welcome Email", price: 39, description: "Make a lasting first impression with a warm, professional welcome.", icon: "/icons/welcome.png", stripeMonthlyId: "price_1RrAnIFjDGmKohCHAFVQH1Ew" },
  { id: "product drop email", title: "Product Drop Email", price: 39, description: "Announce your new product with a sharp branded impact.", icon: "/icons/drop.png", stripeMonthlyId: "price_1RrAnxFjDGmKohCHrqsHz9Z7" },
  { id: "seo blog post", title: "SEO-Optimized Blog Post", price: 59, description: "A keyword-driven blog built to rank on page one.", icon: "/icons/blog.png", stripeMonthlyId: "price_1RrAovFjDGmKohCHvLnPKHf8" },
  { id: "bullet point rewrite", title: "Bullet Point Rewrite", price: 39, description: "Optimize your bullet points high-performance, persuasive language.", icon: "/icons/bullet point rewrite.png", stripeMonthlyId: "price_1RrAqhFjDGmKohCHBPP4F3i1" },
  { id: "faq section", title: "FAQ Section", price: 29, description: "Answer buyer questions before they're asked with a customer-focused FAQ.", icon: "/icons/faq section.png", stripeMonthlyId: "price_1RrArMFjDGmKohCHYT4OISyP" },
  { id: "comparison table", title: "Comparison Table", price: 39, description: "Make decision-making easy with a side-by-side comparison.", icon: "/icons/comparison table.png", stripeMonthlyId: "price_1RrAs9FjDGmKohCHEJ4tkmdY" },
  { id: "seo titles metadata", title: "SEO Titles & Metadata", price: 39, description: "Keyword-smart titles that speak both human and search engine.", icon: "/icons/seo.png", stripeMonthlyId: "price_1RrAtGFjDGmKohCHvzgeRw3f" },
  { id: "full site audit", title: "Full Site Audit", price: 179, description: "We'll review your store and provide clear, usable feedback you can apply immediately.", icon: "/icons/full site audit.png", stripeMonthlyId: "price_1RrAuVFjDGmKohCHzjoZfIQ5" },
  { id: "launch kit", title: "Launch Kit", price: 119, description: "Everything you need to launch new products with confidence.", icon: "/icons/launch kit.png", stripeMonthlyId: "price_1RrAyoFjDGmKohCHFlITlQ0H" },
  { id: "expansion kit", title: "Expansion Kit", price: 149, description: "A smart choice for stores expanding their lineup or revamping old content.", icon: "/icons/expansion kit.png", stripeMonthlyId: "price_1RrAztFjDGmKohCHYJYF4khr" },
  { id: "conversion booster", title: "Conversion Booster", price: 129, description: "Revive sluggish listings and amplify your most visited pages.", icon: "/icons/conversion booster.png", stripeMonthlyId: "price_1RrB2IFjDGmKohCHWVM3XyqB" },
  { id: "amazon product description", title: "Amazon Product Description", description: "Optimized for Amazon's algorithm and shopper behavior. Includes SEO-driven copy, brand tone, and strategic formatting.", price: 49, icon: "/icons/amazon product description.png", stripeMonthlyId: "price_1RrB3sFjDGmKohCH96i7R4hi" },
  { id: "amazon bullet points rewrite", title: "Amazon Bullet Points Rewrite", description: "High-performance bullet points designed to boost click-through-rate and conversions.", price: 39, icon: "/icons/amazon bullet point rewrite.png", stripeMonthlyId: "price_1RrB4bFjDGmKohCH3pvtcmn9" },
  { id: "Enhanced Amazon Content", title: "Enhanced Amazon Content", description: "Strategically crafted narratives built to fit Amazon's visual structure.", price: 59, icon: "/icons/enhanced amazon content.png", stripeMonthlyId: "price_1RrB5kFjDGmKohCHHVGJMjnm" },
  { id: "split test variants", title: "Split Test Variants", description: "Run A/B tests with multiple versions of your product's copy to see which converts best. Includes 2 full variants.", price: 69, icon: "/icons/split test variants.png", stripeMonthlyId: "price_1RrBDYFjDGmKohCHE7gydsgB" },
  { id: "branding voice guidelines", title: "Branding Voice Guidelines", description: "Define your unique voice, tone, and messaging pillars so all future content aligns with your brand.", price: 89, icon: "/icons/branding voice guidelines.png", stripeMonthlyId: "price_1RrBEBFjDGmKohCHLRhmPioP" },
  { id: "amazon power pack", title: "Amazon Power Pack", description: "Amazon-optimized description, bullet points, and A+ content.", price: 129, icon: "/icons/amazon power pack.png", stripeMonthlyId: "price_1RrB6wFjDGmKohCHgHxpeQRN", includes: ["Amazon Description","Amazon Bullets","A+ Module Copy"], color: "#fce4ec" },
  { id: "store revamp kit", title: "Store Revamp Kit", description: "Revitalize your store with expert insight and high impact descriptions.", price: 199, stripeMonthlyId: "price_1RrB88FjDGmKohCHTTZcDy5q", icon: "/icons/store revamp kit.png", includes: ["Full Site Audit","Descriptions","Bullets","SEO Metadata"], color: "#fce4ec" },
  { id: "ongoing optimization", title: "Ongoing Optimization", description: "Structured to adapt, improve and help scale your goals.", price: 149, stripeMonthlyId: "price_1RrB9jFjDGmKohCH0yklX14H", icon: "/icons/ongoing optimization.png", includes: ["Product Page Audit","Split Test Variants","SEO Metadata"], color: "#fce4ec" },
  { id: "conversion booster pro", title: "Conversion Booster Pro", description: "Targeted improvements designed to turn traffic into sales.", price: 169, stripeMonthlyId: "price_1RrB9jFjDGmKohCH0yklX14H", icon: "/icons/conversion booster pro.png", includes: ["Landing Page Optimization","Comparison Table","Email Campaign"], color: "#fce4ec" },
];

// component
export default function Pricing() {
  const router = useRouter();
  const [clientId, setClientId] = useState(null);
  const [billingFrequency, setBillingFrequency] = useState("monthly");
  const [showROI, setShowROI] = useState(false);
  const [hoverPlan, setHoverPlan] = useState(null);
  const [hoverProd, setHoverProd] = useState(null);
  const [hoverROI, setHoverROI] = useState(false);
  const [hoverBundle, setHoverBundle] = useState(false);


  useEffect(() => { setClientId(getClientId()); }, []);
  // ROI modal: close on Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") setShowROI(false); };
    if (typeof window !== "undefined") { window.addEventListener("keydown", onKey); }
    return () => { if (typeof window !== "undefined") { window.removeEventListener("keydown", onKey); } };
  }, []); // data-roi-esc-listener

  const addItemAndGo = async (item, quantity = 1) => {
    if (!clientId) return;
    const normalized = [{
      id: String(item.id),
      name: displayName(item),
      description: item.description ?? "",
      icon: item.icon ?? "",
      quantity: Number.isFinite(+quantity) && +quantity > 0 ? Math.floor(+quantity) : 1
    }];
    await saveCart(clientId, normalized);
    router.push("/confirmation");
  };

  const handleOneTime = async (p) => {
    try { await addItemAndGo(p, 1); } catch (e) { alert(e.message); }
  };

  const handlePlan = async (plan) => {
    try {
      if (!clientId) return;
      const expanded = expandSubscriptionPlan(plan);
      if (expanded.length === 0) {
        await addItemAndGo({ ...plan, name: plan.name || plan.title || "Plan" }, 1);
      } else {
        await saveCart(clientId, expanded);
        router.push("/confirmation");
      }
    } catch (e) {
      alert(e.message || "Failed to add plan");
    }
  };

return (
  <>
    <main
      style={{
        maxWidth: 1100,
        margin: "40px auto",
        padding: "0 16px",
        fontFamily:
          "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
      }}
    >

           {/* How it works (centered heading; left-aligned list, centered block) */}
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <h2 style={{ fontSize: 44, margin: "0 0 16px 0" }}>How it works:</h2>
        <ol
          style={{
            display: "inline-block",
            textAlign: "left",
            margin: 0,
            padding: "0 0 0 1.25rem",
            maxWidth: 780,
            lineHeight: 1.55,
          }}
        >
          <li style={{ margin: "12px 0" }}>
            Start by selecting a plan, a single service or build your own bundle
          </li>
          <li style={{ margin: "12px 0" }}>
            Your content is crafted using advanced Search Engine Optimization theory and state of the art AI integration to deliver
            high impact content that help your products shine and convert clicks to sales
          </li>
          <li style={{ margin: "12px 0" }}>
            We deliver your completed products via email, for you to review and deploy immediately, or send back to us if necessary (plan dependent)
          </li>
        </ol>
      </div>


      <h1 style={{ fontSize: 32, marginBottom: 16 }}>Pricing</h1>
      <div style={{ fontSize: 12, color: "#777" }}>
        Products loaded: {oneTimeProducts.length} • Plans: {plans.length}
      </div>
         {/* Billing toggle — segmented, centered, no layout shift */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 10,
          marginTop: 8,
          marginBottom: 16,
        }}
      >
        {/* Segmented control */}
        <div
          role="tablist"
          aria-label="Billing frequency"
          style={{
            display: "inline-flex",
            alignItems: "center",
            background: "#f7f7f8",
            border: "1px solid #e6e6e6",
            borderRadius: 9999,
            padding: 4,
            boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
          }}
        >
          <button
            role="tab"
            aria-selected={billingFrequency === "monthly"}
            onClick={() => setBillingFrequency("monthly")}
            style={{
              width: 110,                 // fixed width to prevent shift
              padding: "8px 14px",
              border: "none",
              borderRadius: 9999,
              cursor: "pointer",
              background: billingFrequency === "monthly" ? "#111" : "transparent",
              color: billingFrequency === "monthly" ? "#fff" : "#111",
              fontWeight: 600,
              transition: "background 150ms ease, color 150ms ease",
            }}
          >
            Monthly
          </button>

          <button
            role="tab"
            aria-selected={billingFrequency === "yearly"}
            onClick={() => setBillingFrequency("yearly")}
            style={{
              width: 110,                 // fixed width to prevent shift
              padding: "8px 14px",
              border: "none",
              borderRadius: 9999,
              cursor: "pointer",
              background: billingFrequency === "yearly" ? "#111" : "transparent",
              color: billingFrequency === "yearly" ? "#fff" : "#111",
              fontWeight: 600,
              transition: "background 150ms ease, color 150ms ease",
            }}
          >
            Yearly
          </button>
        </div>

        {/* Fixed-width badge area to avoid re-centering on toggle */}
        <div style={{ width: 140, display: "flex", justifyContent: "flex-start" }}>
          {billingFrequency === "yearly" ? (
            <span
              style={{
                fontSize: 12,
                color: "#0a7",
                padding: "4px 8px",
                borderRadius: 9999,
                background: "rgba(16,185,129,0.08)",
                border: "1px solid rgba(16,185,129,0.25)",
                whiteSpace: "nowrap",
              }}
            >
              Save vs monthly
            </span>
          ) : (
            // placeholder keeps width so the control doesn't move
            <span style={{ visibility: "hidden", fontSize: 12, padding: "4px 8px" }}>
              Save vs monthly
            </span>
          )}
        </div>
      </div>

      <section style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 22, marginBottom: 8 }}>Plans</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 16,
          }}
        >
          {plans.map((p) => (
<div
  key={p.id}
  onMouseEnter={() => setHoverPlan(p.id)}
  onMouseLeave={() => setHoverPlan(null)}
  style={{
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
    border: "1px solid #eee",
    borderRadius: 12,
    padding: 16,
    minHeight: 360,
    boxShadow: hoverPlan === p.id ? "0 10px 28px rgba(0,0,0,0.14)" : "0 2px 10px rgba(0,0,0,0.08)",
    transform: hoverPlan === p.id ? "translateY(-4px)" : "translateY(0)",
    transition: "transform 150ms ease, box-shadow 150ms ease",
  }}
>


              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {p.icon ? (
                  <img src={p.icon} alt="" width={28} height={28} />
                ) : (
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      background: "#eee",
                      borderRadius: 6,
                    }}
                  />
                )}
                <strong>{p.name || p.title}</strong>
              </div>
              <p style={{ color: "#555" }}>{p.description}</p>
              {/* plan feature list */}
<ul style={{ margin: "8px 0 0 0", paddingLeft: "1.2rem", color: "#333" }}>
  {[
    (Number(p.productDescriptions) > 0) &&
      `${p.productDescriptions} product description${Number(p.productDescriptions) > 1 ? "s" : ""}`,
    (Number(p.productOverview) > 0) &&
      `${p.productOverview} product overview${Number(p.productOverview) > 1 ? "s" : ""}`,
    (Number(p.bulletRewrites) > 0) &&
      `${p.bulletRewrites} bullet point rewrite${Number(p.bulletRewrites) > 1 ? "s" : ""}`,
    (Number(p.seoMetadata) > 0) &&
      `${p.seoMetadata} SEO titles & metadata`,
    (Number(p.welcomeEmail) > 0) &&
      `${p.welcomeEmail} welcome email${Number(p.welcomeEmail) > 1 ? "s" : ""}`,
    (p.blog) &&
      (typeof p.blog === "number"
        ? `${p.blog} blog post${p.blog > 1 ? "s" : ""}`
        : String(p.blog)),
    (p.email) &&
      (typeof p.email === "number"
        ? `${p.email} email campaign${p.email > 1 ? "s" : ""}`
        : String(p.email)),
    (p.extra) &&
      (typeof p.extra === "number"
        ? `${p.extra} comparison table${p.extra > 1 ? "s" : ""}`
        : String(p.extra)),
    (p.faq) &&
      (typeof p.faq === "number"
        ? `${p.faq} FAQ section${p.faq > 1 ? "s" : ""}`
        : String(p.faq)),
    p.revisions && String(p.revisions),
  ]
    .filter(Boolean)
    .map((t, i) => (
      <li key={i} style={{ margin: "4px 0" }}>{t}</li>
    ))}
</ul>

            {/* dynamic plan price */}
<div style={{ marginTop: "auto" }}>
  <div style={{ margin: "8px 0", fontWeight: 700 }}>
    {formatUSD(planPrice(p, billingFrequency))}{" "}
    <span style={{ fontWeight: 400, color: "#666" }}>
      / {billingFrequency === "yearly" ? "year" : "month"}
    </span>
  </div>

  {billingFrequency === "yearly" && planSavings(p) > 0 && (
    <div style={{ fontSize: 12, color: "#0a7", marginTop: -4, marginBottom: 8 }}>
      Save {formatUSD(planSavings(p))} vs monthly
    </div>
  )}

<button
  onClick={() => handlePlan(p)}
  style={{
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #ddd",
    background: "#111",
    cursor: "pointer",
    color: "#fff",
    alignSelf: "flex-start",
    minWidth: 140,
    boxShadow: hoverPlan === p.id ? "0 6px 18px rgba(0,0,0,0.18)" : "0 2px 8px rgba(0,0,0,0.10)",
    transform: hoverPlan === p.id ? "translateY(-2px)" : "translateY(0)",
    transition: "transform 150ms ease, box-shadow 150ms ease",
  }}
>
  Add Plan
</button>

</div>

            </div>
          ))}
        </div>
      </section>

      {/* ROI trigger (lightbulb) */} {/* data-roi-trigger */}
<div style={{ textAlign: "center", margin: "20px 0 8px 0" }}>
  <div style={{ marginBottom: 8, fontWeight: 500 }}>
    Not sure how we can help? Click the lightbulb to use our conversion calculator...
  </div>
<button
  onClick={() => setShowROI(true)}
  onMouseEnter={() => setHoverROI(true)}
  onMouseLeave={() => setHoverROI(false)}
  style={{ border: "none", background: "transparent", cursor: "pointer", padding: 0 }}
  aria-label="Open ROI Calculator"
>
  <img
    src="/lightbulb.svg"
    alt="Open ROI Calculator"
    width={56}
    height={56}
    style={{
      display: "inline-block",
      borderRadius: "50%",
      transition: "transform 150ms ease, box-shadow 150ms ease",
      transform: hoverROI ? "translateY(-3px)" : "translateY(0)",
      boxShadow: hoverROI ? "0 8px 20px rgba(0,0,0,0.18)" : "0 2px 8px rgba(0,0,0,0.10)",
    }}
    onError={(e) => {
      try { e.currentTarget.src = "/icons/lightbulb.svg"; } catch {}
    }}
  />
</button>
</div>

            {/* One-time Products header + Build-a-Bundle CTA */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          marginBottom: "1rem",
        }}
      >
        <h2 style={{ fontSize: 22, marginBottom: 8 }}>One-time Products</h2>
        <div style={{ textAlign: "right", marginTop: "-2.5rem" }}>
          <div style={{ fontSize: 13, color: "#555", marginBottom: 6 }}>
            or you can build your own bundle:
          </div>
       <button
  onClick={() => router.push("/build-a-bundle")}
  onMouseEnter={() => setHoverBundle(true)}
  onMouseLeave={() => setHoverBundle(false)}
  style={{
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #0fc24bff",
    background: "#0fc24bff", // emerald
    cursor: "pointer",
    color: "#fff",
    fontWeight: 600,
    boxShadow: hoverBundle ? "0 8px 20px rgba(0,0,0,0.18)" : "0 2px 8px rgba(0,0,0,0.10)",
    transform: hoverBundle ? "translateY(-3px)" : "translateY(0)",
    transition: "transform 150ms ease, box-shadow 150ms ease",
  }}
  aria-label="Build a Bundle"
>
  Build a Bundle
</button>
        </div>
      </div>

       <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 16,
        }}
      ></div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
          gap: 16,
        }}
      >

        {oneTimeProducts.map((p) => (
<div
  key={p.id}
  onMouseEnter={() => setHoverProd(p.id)}
  onMouseLeave={() => setHoverProd(null)}
  style={{
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
    border: "1px solid #eee",
    borderRadius: 12,
    padding: 16,
    minHeight: 300,
    boxShadow: hoverProd === p.id ? "0 10px 28px rgba(0,0,0,0.14)" : "0 2px 10px rgba(0,0,0,0.08)",
    transform: hoverProd === p.id ? "translateY(-4px)" : "translateY(0)",
    transition: "transform 150ms ease, box-shadow 150ms ease",
  }}
>


            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {p.icon ? (
                <img src={p.icon} alt="" width={28} height={28} />
              ) : (
                <div style={{ width: 28, height: 28, background: "#eee", borderRadius: 6 }} />
              )}
              <strong>{displayName(p)}</strong>
            </div>
            <p style={{ color: "#555" }}>{p.description}</p>
          <div style={{ marginTop: "auto" }}>
  <div style={{ margin: "8px 0", fontWeight: 700 }}>
    ${p.price?.toFixed ? p.price.toFixed(2) : p.price}
  </div>
  <button
  onClick={() => handleOneTime(p)}
  style={{
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid #ddd",
    background: "#111",
    cursor: "pointer",
    color: "#fff",
    alignSelf: "flex-start",
    minWidth: 140,
    boxShadow: hoverProd === p.id ? "0 6px 18px rgba(0,0,0,0.18)" : "0 2px 8px rgba(0,0,0,0.10)",
    transform: hoverProd === p.id ? "translateY(-2px)" : "translateY(0)",
    transition: "transform 150ms ease, box-shadow 150ms ease",
  }}
>
  Order Now
</button>

</div>
          </div>
        ))}
      </div>
    </main>

    {/* ROI Modal */} {/* data-roi-modal */}
    {showROI && (
      <div
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9999 }}
        onClick={() => setShowROI(false)}
      >
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.stopPropagation()}
          style={{
            maxWidth: 720,
            margin: "6vh auto",
            background: "#fff",
            borderRadius: 12,
            padding: 16,
            boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
            position: "relative",
          }}
        >
          <button
            onClick={() => setShowROI(false)}
            aria-label="Close ROI Calculator"
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              border: "none",
              background: "transparent",
              fontSize: 24,
              lineHeight: 1,
              cursor: "pointer",
              color: "#111",
            }}
          >
            x
          </button>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 600 }}>Conversion Calculator</div>
          </div>

          <div>
            <ROICalculator />
          </div>
        </div>
      </div>
    )}
  </>
)};
