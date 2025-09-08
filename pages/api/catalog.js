/**
 * pages/api/catalog.js
 * Hardened: clamps inputs, sets sane cache headers, avoids 500s if table missing,
 * returns fallback catalog on errors (keeps pricing page alive).
 */
import { getPool } from "../../lib/db.mjs";

const isProd = process.env.NODE_ENV === "production";
const MAX_LIMIT = 500;

function clampLimit(q) {
  const n = Number(q?.limit);
  if (!Number.isFinite(n)) return MAX_LIMIT;
  return Math.max(1, Math.min(MAX_LIMIT, Math.floor(n)));
}

// Fallback so pricing never 500s during schema changes/rollouts
function fallbackCatalog() {
  return [
    { id: "SEO_ARTICLE",     name: "SEO Article",      price_cents: 2500, stripe_price_id: null, description: "", icon: "" },
    { id: "KEYWORD_RESEARCH",name: "Keyword Research", price_cents: 1500, stripe_price_id: null, description: "", icon: "" },
    { id: "SITE_AUDIT",      name: "Site Audit",       price_cents: 5000, stripe_price_id: null, description: "", icon: "" },
  ];
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // Cache: dev = no-store; prod = CDN-friendly with SWR
  res.setHeader(
    "Cache-Control",
    isProd ? "public, max-age=300, s-maxage=300, stale-while-revalidate=120" : "no-store"
  );
  // Keep APIs out of search indexes
  res.setHeader("X-Robots-Tag", "noindex");

  const limit = clampLimit(req.query);

  try {
    const pool = await getPool();

    // Avoid hard failure if table not yet created
    const reg = await pool.query(`select to_regclass('public.catalog_items') as t`);
    const hasTable = !!reg.rows?.[0]?.t;
    if (!hasTable) {
      return res.status(200).json({ ok: true, items: fallbackCatalog(), degraded: true, reason: "no_table" });
    }

    const { rows } = await pool.query(
      `
      select
        id::text                                  as id,
        coalesce(title, id::text)                 as name,
        coalesce(price_cents, 0)::int             as price_cents,
        stripe_price_id,
        coalesce(description, '')                 as description,
        coalesce(icon, '')                        as icon
      from public.catalog_items
      order by lower(coalesce(title, id::text)) asc
      limit $1
      `,
      [limit]
    );

    const items = (rows || []).map((r) => ({
      id: r.id,
      name: r.name,
      price_cents: Number.isFinite(r.price_cents) ? r.price_cents : 0,
      stripe_price_id: r.stripe_price_id || null,
      description: r.description || "",
      icon: r.icon || "",
    }));

    return res.status(200).json({ ok: true, items, count: items.length });
  } catch (e) {
    // Don’t break the UX; serve fallback with a degradation signal
    console.error(JSON.stringify({ where: "api/catalog", error: e?.message || String(e) }));
    return res.status(200).json({ ok: true, items: fallbackCatalog(), degraded: true, reason: "exception" });
  }
}

