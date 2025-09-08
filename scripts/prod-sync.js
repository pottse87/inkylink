"use strict";
const { Pool } = require("pg");

// ---------- Authoritative DATA ----------

// PLANS
const plans = [
  { id: "starter", name: "Starter Plan", description: "Streamlined precision with a professional edge.", priceMonthly: 69,  priceYearly: 699,  stripeMonthlyId: "price_1RrASOFjDGmKohCH3emQcGkw", stripeYearlyId: "price_1RrAWzFjDGmKohCHaTwI70lD", icon: "/icons/starter.png", productDescriptions: 1,  productOverview: 2,  bulletRewrites: 1,  welcomeEmail: 1,  color: "#e8f5e9" },
  { id: "growth",  name: "Growth Plan",  description: "Content that scales as fast as your catalog.",   priceMonthly: 129, priceYearly: 1299, stripeMonthlyId: "price_1RrAZCFjDGmKohCHxEnUiiHn", stripeYearlyId: "price_1RrAa2FjDGmKohCHOnxsKpAJ", icon: "/icons/growth.png",  productDescriptions: 3,  productOverview: 3,  bulletRewrites: 2,  welcomeEmail: 1,  seoMetadata: 2, color: "#e3f2fd" },
  { id: "pro",     name: "Pro Plan",     description: "Strategic content development tailored to established names.", priceMonthly: 229, priceYearly: 2299, stripeMonthlyId: "price_1RrAcJFjDGmKohCHEzzR4KF7", stripeYearlyId: "price_1RrAdjFjDGmKohCHwYxagpG4", icon: "/icons/pro.png",     productDescriptions: 5,  productOverview: 5,  bulletRewrites: 3,  seoMetadata: 2, welcomeEmail: 2, blog: "1 blog post", faq: "1 FAQ section", revisions: "Up to 2 revisions per item/month", color: "#ede7f6" },
  { id: "elite",   name: "Elite Plan",   description: "Consistent monthly content to match your business velocity.", priceMonthly: 329, priceYearly: 3299, stripeMonthlyId: "price_1RrAfJFjDGmKohCHuZ3dZPUs", stripeYearlyId: "price_1RrAglFjDGmKohCHmVeQg6YC", icon: "/icons/elite.png",   productDescriptions: 15, productOverview: 3,  bulletRewrites: 5,  seoMetadata: 4, welcomeEmail: 2, blog: "1 blog post", email: "1 email campaign", extra: "1 comparison table", faq: "1 FAQ section", revisions: "Up to 2 revisions per item/ month ", color: "#fff3e0" },
];

// ONE-TIME PRODUCTS (with includes/color + Stripe price ids)
const products = [
  { id: "product description",           title: "Product Description",             price: 39,  description: "Stand out in search with expertly crafted product descriptions.", icon: "/icons/desc.png",                          stripeMonthlyId: "price_1RrAiGFjDGmKohCHv5acUOmw" },
  { id: "product overview",              title: "Product Overview",                price: 29,  description: "Highlight your product in a quick, easy-to-read snapshot.",        icon: "/icons/overview.png",                      stripeMonthlyId: "price_1RrAkaFjDGmKohCHFah1gFHG" },
  { id: "welcome email",                 title: "Welcome Email",                   price: 39,  description: "Make a lasting first impression with a warm, professional welcome.", icon: "/icons/welcome.png",                       stripeMonthlyId: "price_1RrAnIFjDGmKohCHAFVQH1Ew" },
  { id: "product drop email",            title: "Product Drop Email",              price: 39,  description: "Announce your new product with a sharp branded impact.",            icon: "/icons/drop.png",                          stripeMonthlyId: "price_1RrAnxFjDGmKohCHrqsHz9Z7" },
  { id: "seo blog post",                 title: "SEO-Optimized Blog Post",         price: 59,  description: "A keyword-driven blog built to rank on page one.",                  icon: "/icons/blog.png",                          stripeMonthlyId: "price_1RrAovFjDGmKohCHvLnPKHf8" },
  { id: "bullet point rewrite",          title: "Bullet Point Rewrite",            price: 39,  description: "Optimize your bullet points high-performance, persuasive language.", icon: "/icons/bullet point rewrite.png",         stripeMonthlyId: "price_1RrAqhFjDGmKohCHBPP4F3i1" },
  { id: "faq section",                   title: "FAQ Section",                     price: 29,  description: "Answer buyer questions before they're asked with a customer-focused FAQ.", icon: "/icons/faq section.png",          stripeMonthlyId: "price_1RrArMFjDGmKohCHYT4OISyP" },
  { id: "comparison table",              title: "Comparison Table",                price: 39,  description: "Make decision-making easy with a side-by-side comparison.",         icon: "/icons/comparison table.png",             stripeMonthlyId: "price_1RrAs9FjDGmKohCHEJ4tkmdY" },
  { id: "seo titles metadata",           title: "SEO Titles & Metadata",           price: 39,  description: "Keyword-smart titles that speak both human and search engine.",      icon: "/icons/seo.png",                           stripeMonthlyId: "price_1RrAtGFjDGmKohCHvzgeRw3f" },
  { id: "full site audit",               title: "Full Site Audit",                 price: 179, description: "We'll review your store and provide clear, usable feedback you can apply immediately.", icon: "/icons/full site audit.png", stripeMonthlyId: "price_1RrAuVFjDGmKohCHzjoZfIQ5" },
  { id: "launch kit",                    title: "Launch Kit",                      price: 119, description: "Everything you need to launch new products with confidence.",        icon: "/icons/launch kit.png",                   stripeMonthlyId: "price_1RrAyoFjDGmKohCHFlITlQ0H" },
  { id: "expansion kit",                 title: "Expansion Kit",                   price: 149, description: "A smart choice for stores expanding their lineup or revamping old content.", icon: "/icons/expansion kit.png",      stripeMonthlyId: "price_1RrAztFjDGmKohCHYJYF4khr" },
  { id: "conversion booster",            title: "Conversion Booster",              price: 129, description: "Revive sluggish listings and amplify your most visited pages.",      icon: "/icons/conversion booster.png",           stripeMonthlyId: "price_1RrB2IFjDGmKohCHWVM3XyqB" },
  { id: "amazon product description",    title: "Amazon Product Description",      price: 49,  description: "Optimized for Amazon's algorithm and shopper behavior. Includes SEO-driven copy, brand tone, and strategic formatting.", icon: "/icons/amazon product description.png", stripeMonthlyId: "price_1RrB3sFjDGmKohCH96i7R4hi" },
  { id: "amazon bullet points rewrite",  title: "Amazon Bullet Points Rewrite",    price: 39,  description: "High-performance bullet points designed to boost click-through-rate and conversions.", icon: "/icons/amazon bullet point rewrite.png", stripeMonthlyId: "price_1RrB4bFjDGmKohCH3pvtcmn9" },
  { id: "Enhanced Amazon Content",       title: "Enhanced Amazon Content",         price: 59,  description: "Strategically crafted narratives built to fit Amazon's visual structure.", icon: "/icons/enhanced amazon content.png",      stripeMonthlyId: "price_1RrB5kFjDGmKohCHHVGJMjnm" },
  { id: "split test variants",           title: "Split Test Variants",             price: 69,  description: "Run A/B tests with multiple versions of your product's copy to see which converts best. Includes 2 full variants.", icon: "/icons/split test variants.png", stripeMonthlyId: "price_1RrBDYFjDGmKohCHE7gydsgB" },
  { id: "branding voice guidelines",     title: "Branding Voice Guidelines",       price: 89,  description: "Define your unique voice, tone, and messaging pillars so all future content aligns with your brand.", icon: "/icons/branding voice guidelines.png", stripeMonthlyId: "price_1RrBEBFjDGmKohCHLRhmPioP" },
  { id: "amazon power pack",             title: "Amazon Power Pack",               price: 129, description: "Amazon-optimized description, bullet points, and A+ content.",       icon: "/icons/amazon power pack.png",            stripeMonthlyId: "price_1RrB6wFjDGmKohCHgHxpeQRN", includes: ["Amazon Description","Amazon Bullets","A+ Module Copy"], color: "#fce4ec" },
  { id: "store revamp kit",              title: "Store Revamp Kit",                price: 199, description: "Revitalize your store with expert insight and high impact descriptions.", icon: "/icons/store revamp kit.png",      stripeMonthlyId: "price_1RrB88FjDGmKohCHTTZcDy5q", includes: ["Full Site Audit","Descriptions","Bullets","SEO Metadata"], color: "#fce4ec" },
  { id: "ongoing optimization",          title: "Ongoing Optimization",            price: 149, description: "Structured to adapt, improve and help scale your goals.",            icon: "/icons/ongoing optimization.png",         stripeMonthlyId: "price_1RrB9jFjDGmKohCH0yklX14H", includes: ["Product Page Audit","Split Test Variants","SEO Metadata"], color: "#fce4ec" },
  { id: "conversion booster pro",        title: "Conversion Booster Pro",          price: 169, description: "Targeted improvements designed to turn traffic into sales.",         icon: "/icons/conversion booster pro.png",       stripeMonthlyId: "price_1RrBBNFjDGmKohCHE209rvTT", includes: ["Landing Page Optimization","Comparison Table","Email Campaign"], color: "#fce4ec" },
];

// ---------- Helpers ----------
function kebabify(s) {
  return String(s || "")
    .trim().toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
function dollarsToCents(x) {
  const n = Number(x);
  if (!Number.isFinite(n) || n < 0) throw new Error(`Invalid price: ${x}`);
  return Math.round(n * 100);
}

// ---------- Work ----------
(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: (process.env.PGSSLMODE==="disable"||process.env.DB_SSL==="0"||process.env.DB_SSL==="false") ? false : { rejectUnauthorized: false } });
  const db = await pool.connect();
  try {
    await db.query("BEGIN");

    // 4.a Fix the two Stripe price IDs explicitly (idempotent)
    await db.query(`
      UPDATE public.catalog_items
      SET stripe_price_id = 'price_1RrB9jFjDGmKohCH0yklX14H'
      WHERE id = 'ongoing-optimization' AND stripe_price_id IS DISTINCT FROM 'price_1RrB9jFjDGmKohCH0yklX14H';
    `);
    await db.query(`
      UPDATE public.catalog_items
      SET stripe_price_id = 'price_1RrBBNFjDGmKohCHE209rvTT'
      WHERE id = 'conversion-booster-pro' AND stripe_price_id IS DISTINCT FROM 'price_1RrBBNFjDGmKohCHE209rvTT';
    `);

    // 4.b Upsert products (includes + color + stripe_price_id)
    const upsertProductSQL = `
      INSERT INTO public.catalog_items (id, title, description, icon, price_cents, stripe_price_id, includes, color)
      VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8)
      ON CONFLICT (id) DO UPDATE
        SET title = EXCLUDED.title,
            description = EXCLUDED.description,
            icon = EXCLUDED.icon,
            price_cents = EXCLUDED.price_cents,
            stripe_price_id = EXCLUDED.stripe_price_id,
            includes = EXCLUDED.includes,
            color = EXCLUDED.color
      RETURNING (xmax = 0) AS inserted;
    `;
    let insP = 0, updP = 0;
    for (const p of products) {
      const row = {
        id: kebabify(p.id || p.title),
        title: String(p.title || p.name || p.id).trim(),
        description: p.description ? String(p.description) : null,
        icon: p.icon ? String(p.icon) : null,
        price_cents: dollarsToCents(p.price),
        stripe_price_id: p.stripeMonthlyId || null,
        includes: Array.isArray(p.includes) ? p.includes : null,
        color: p.color || null
      };
      const r = await db.query(upsertProductSQL, [
        row.id, row.title, row.description, row.icon, row.price_cents,
        row.stripe_price_id, JSON.stringify(row.includes), row.color
      ]);
      if (r.rows[0]?.inserted) insP++; else updP++;
    }

    // 4.c Upsert plans
    const upsertPlanSQL = `
      INSERT INTO public.plans
        (id, name, description, icon, color,
         price_monthly_cents, price_yearly_cents,
         stripe_monthly_id, stripe_yearly_id,
         product_descriptions, product_overview, bullet_rewrites, welcome_email, seo_metadata,
         blog, faq, revisions, email, extra)
      VALUES
        ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
      ON CONFLICT (id) DO UPDATE SET
        name=$2, description=$3, icon=$4, color=$5,
        price_monthly_cents=$6, price_yearly_cents=$7,
        stripe_monthly_id=$8, stripe_yearly_id=$9,
        product_descriptions=$10, product_overview=$11, bullet_rewrites=$12,
        welcome_email=$13, seo_metadata=$14, blog=$15, faq=$16, revisions=$17, email=$18, extra=$19
      RETURNING (xmax = 0) AS inserted;
    `;
    let insL = 0, updL = 0;
    for (const pl of plans) {
      const r = await db.query(upsertPlanSQL, [
        pl.id, pl.name, pl.description || null, pl.icon || null, pl.color || null,
        dollarsToCents(pl.priceMonthly), dollarsToCents(pl.priceYearly),
        pl.stripeMonthlyId || null, pl.stripeYearlyId || null,
        pl.productDescriptions ?? null, pl.productOverview ?? null, pl.bulletRewrites ?? null,
        pl.welcomeEmail ?? null, pl.seoMetadata ?? null,
        pl.blog ?? null, pl.faq ?? null, pl.revisions ?? null, pl.email ?? null, pl.extra ?? null
      ]);
      if (r.rows[0]?.inserted) insL++; else updL++;
    }

    await db.query("COMMIT");

    // Verify summary
    const countProducts = (await db.query("SELECT COUNT(*)::int AS n FROM public.catalog_items")).rows[0].n;
    const checkStripe = await db.query(`
      SELECT id, stripe_price_id
      FROM public.catalog_items
      WHERE id IN ('ongoing-optimization','conversion-booster-pro')
      ORDER BY id;
    `);
    const countPlans = (await db.query("SELECT COUNT(*)::int AS n FROM public.plans")).rows[0].n;

    console.log(JSON.stringify({
      ok: true,
      products: { inserted: insP, updated: updP, totalNow: countProducts, fixedStripeIDs: checkStripe.rows },
      plans:    { inserted: insL, updated: updL, totalNow: countPlans }
    }, null, 2));
  } catch (e) {
    try { await db.query("ROLLBACK"); } catch {}
    console.error(e.message || String(e));
    process.exit(1);
  } finally {
    db.release();
    await pool.end();
  }
})();

