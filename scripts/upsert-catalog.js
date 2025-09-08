"use strict";
const { Pool } = require("pg");

const oneTimeProducts = [
  { id: "product description",           title: "Product Description",             price: 39,  description: "Stand out in search...", icon: "/icons/desc.png",                          stripeMonthlyId: "price_1RrAiGFjDGmKohCHv5acUOmw" },
  { id: "product overview",              title: "Product Overview",                price: 29,  description: "Highlight your product...", icon: "/icons/overview.png",                    stripeMonthlyId: "price_1RrAkaFjDGmKohCHFah1gFHG" },
  { id: "welcome email",                 title: "Welcome Email",                   price: 39,  description: "Make a lasting first impression...", icon: "/icons/welcome.png",           stripeMonthlyId: "price_1RrAnIFjDGmKohCHAFVQH1Ew" },
  { id: "product drop email",            title: "Product Drop Email",              price: 39,  description: "Announce your new product...", icon: "/icons/drop.png",                    stripeMonthlyId: "price_1RrAnxFjDGmKohCHrqsHz9Z7" },
  { id: "seo blog post",                 title: "SEO-Optimized Blog Post",         price: 59,  description: "A keyword-driven blog...", icon: "/icons/blog.png",                        stripeMonthlyId: "price_1RrAovFjDGmKohCHvLnPKHf8" },
  { id: "bullet point rewrite",          title: "Bullet Point Rewrite",            price: 39,  description: "Optimize your bullet points...", icon: "/icons/bullet point rewrite.png", stripeMonthlyId: "price_1RrAqhFjDGmKohCHBPP4F3i1" },
  { id: "faq section",                   title: "FAQ Section",                     price: 29,  description: "Answer buyer questions...", icon: "/icons/faq section.png",                stripeMonthlyId: "price_1RrArMFjDGmKohCHYT4OISyP" },
  { id: "comparison table",              title: "Comparison Table",                price: 39,  description: "Make decision-making easy...", icon: "/icons/comparison table.png",       stripeMonthlyId: "price_1RrAs9FjDGmKohCHEJ4tkmdY" },
  { id: "seo titles metadata",           title: "SEO Titles & Metadata",           price: 39,  description: "Keyword-smart titles...", icon: "/icons/seo.png",                          stripeMonthlyId: "price_1RrAtGFjDGmKohCHvzgeRw3f" },
  { id: "full site audit",               title: "Full Site Audit",                 price: 179, description: "We'll review your store...", icon: "/icons/full site audit.png",           stripeMonthlyId: "price_1RrAuVFjDGmKohCHzjoZfIQ5" },
  { id: "launch kit",                    title: "Launch Kit",                      price: 119, description: "Everything you need to launch...", icon: "/icons/launch kit.png",         stripeMonthlyId: "price_1RrAyoFjDGmKohCHFlITlQ0H" },
  { id: "expansion kit",                 title: "Expansion Kit",                   price: 149, description: "A smart choice for stores...", icon: "/icons/expansion kit.png",           stripeMonthlyId: "price_1RrAztFjDGmKohCHYJYF4khr" },
  { id: "conversion booster",            title: "Conversion Booster",              price: 129, description: "Revive sluggish listings...", icon: "/icons/conversion booster.png",       stripeMonthlyId: "price_1RrB2IFjDGmKohCHWVM3XyqB" },
  { id: "amazon product description",    title: "Amazon Product Description",      price: 49,  description: "Optimized for Amazon's algorithm...", icon: "/icons/amazon product description.png", stripeMonthlyId: "price_1RrB3sFjDGmKohCH96i7R4hi" },
  { id: "amazon bullet points rewrite",  title: "Amazon Bullet Points Rewrite",    price: 39,  description: "High-performance bullet points...", icon: "/icons/amazon bullet point rewrite.png",  stripeMonthlyId: "price_1RrB4bFjDGmKohCH3pvtcmn9" },
  { id: "Enhanced Amazon Content",       title: "Enhanced Amazon Content",         price: 59,  description: "Strategically crafted narratives...", icon: "/icons/enhanced amazon content.png",   stripeMonthlyId: "price_1RrB5kFjDGmKohCHHVGJMjnm" },
  { id: "split test variants",           title: "Split Test Variants",             price: 69,  description: "Run A/B tests...", icon: "/icons/split test variants.png",                 stripeMonthlyId: "price_1RrBDYFjDGmKohCHE7gydsgB" },
  { id: "branding voice guidelines",     title: "Branding Voice Guidelines",       price: 89,  description: "Define your unique voice...", icon: "/icons/branding voice guidelines.png", stripeMonthlyId: "price_1RrBEBFjDGmKohCHLRhmPioP" },
  { id: "amazon power pack",             title: "Amazon Power Pack",               price: 129, description: "Amazon-optimized description...", icon: "/icons/amazon power pack.png",    stripeMonthlyId: "price_1RrB6wFjDGmKohCHgHxpeQRN" },
  { id: "store revamp kit",              title: "Store Revamp Kit",                price: 199, description: "Revitalize your store...", icon: "/icons/store revamp kit.png",            stripeMonthlyId: "price_1RrB88FjDGmKohCHTTZcDy5q" },
  { id: "ongoing optimization",          title: "Ongoing Optimization",            price: 149, description: "Structured to adapt...", icon: "/icons/ongoing optimization.png",          stripeMonthlyId: "price_1RrB9jFjDGmKohCH0yklX14H" },
  { id: "conversion booster pro",        title: "Conversion Booster Pro",          price: 169, description: "Targeted improvements...", icon: "/icons/conversion booster pro.png",      stripeMonthlyId: "price_1RrBBNFjDGmKohCHE209rvTT" }
];

function kebabify(s){return String(s||"").trim().toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"");}
function dollarsToCents(x){ return Math.round(Number(x) * 100); }

const normalized = oneTimeProducts.map(p => ({
  id: kebabify(p.id || p.title),
  title: String(p.title || p.name || p.id).trim(),
  description: p.description ? String(p.description) : null,
  icon: p.icon ? String(p.icon) : null,
  price_cents: dollarsToCents(p.price),
  stripe_price_id: p.stripeMonthlyId || p.stripe_price_id || null
}));

(async () => {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: (process.env.PGSSLMODE==="disable"||process.env.DB_SSL==="0"||process.env.DB_SSL==="false") ? false : { rejectUnauthorized: false }
  });
  const client = await pool.connect();
  const sql = `
    INSERT INTO public.catalog_items (id, title, description, icon, price_cents, stripe_price_id)
    VALUES ($1,$2,$3,$4,$5,$6)
    ON CONFLICT (id) DO UPDATE
      SET title=EXCLUDED.title,
          description=EXCLUDED.description,
          icon=EXCLUDED.icon,
          price_cents=EXCLUDED.price_cents,
          stripe_price_id=EXCLUDED.stripe_price_id
    RETURNING (xmax = 0) AS inserted
  `;
  try {
    await client.query("BEGIN");
    let inserted = 0, updated = 0;
    for (const r of normalized) {
      const res = await client.query(sql, [r.id, r.title, r.description, r.icon, r.price_cents, r.stripe_price_id]);
      if (res.rows[0]?.inserted === true) inserted++; else updated++;
    }
    await client.query("COMMIT");
    console.log(JSON.stringify({ ok: true, inserted, updated, total: normalized.length }, null, 2));
  } catch (e) {
    try { await client.query("ROLLBACK"); } catch {}
    console.error(e.message || String(e)); process.exit(1);
  } finally {
    client.release(); await pool.end();
  }
})();
