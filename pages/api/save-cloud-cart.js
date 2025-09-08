import { getPool } from '../../lib/db';

/**
 * POST /api/save-cloud-cart
 * Body: { client_id: string, items?: any[], mode?: "merge" | "replace", clear?: boolean }
 *
 * Behavior:
 *  - Ensures carts table exists
 *  - Canonicalizes deliverables by DB catalog id (fallback to normalized title) and merges by (canon id + unit price)
 *  - Plans are deduped by (plan_id + billing) with last-write-wins (quantity=1 per plan line)
 *  - Modes:
 *      merge (default): merge current + incoming (incoming empty => no-op)
 *      replace: overwrite with incoming (empty incoming => empty cart)
 *      clear: empty cart regardless of incoming
 *  - UPSERTs by client_id
 *  - Sets a recoverable client_id cookie (non-HttpOnly) for SSR/client
 *  - Returns { ok, client_id, count, items, mode }
 */
export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", ["POST"]);
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    const body = req.body || {};
    const client_id = String(body?.client_id || "").trim();
    if (!client_id) return res.status(400).json({ error: "client_id required" });

    const clearFlag = body?.clear === true;
    const modeIn = String(body?.mode || "").toLowerCase();
    const mode = clearFlag ? "clear" : (modeIn === "replace" ? "replace" : "merge"); // default merge
    const rawItems = Array.isArray(body?.items) ? body.items : [];

    // Recoverable cookie ~90 days
    res.setHeader(
      "Set-Cookie",
      `inkylink_client_id=${encodeURIComponent(client_id)}; Path=/; Max-Age=7776000; SameSite=Lax`);
    res.setHeader("Cache-Control", "no-store");

    const pool = getPool();

    const db = await pool.connect();
    try {
      // Ensure carts table
      await db.query(`
        CREATE TABLE IF NOT EXISTS public.carts (
          client_id  text PRIMARY KEY,
          items      jsonb NOT NULL DEFAULT '[]'::jsonb,
          updated_at timestamptz NOT NULL DEFAULT NOW());
      `);

      // Catalog map: title -> id (for canonicalization)
      const cat = await db.query(`SELECT id, title FROM public.catalog_items;`).catch(() => ({ rows: [] }));
      const norm = (s) => String(s || "").toLowerCase().replace(/\s+/g, " ").trim();
      const titleToId = new Map();
      for (const r of cat.rows || []) titleToId.set(norm(r.title), String(r.id));

      // Load current items for merge semantics
      const cur = await db.query("SELECT items FROM public.carts WHERE client_id=$1", [client_id]);
      const currentItems = Array.isArray(cur?.rows?.[0]?.items) ? cur.rows[0].items : [];

      // ---------- Helpers ----------
      const sanitize = (it) => {
        const q = Math.max(1, Number(it?.quantity ?? 1) || 1);
        const price = Number(it?.price_cents) || 0;
        const name =
          typeof it?.name === "string"
            ? it.name
            : (typeof it?.title === "string" ? it.title : "");
        return {
          ...it,
          name,
          price_cents: price,
          quantity: q,
        };
      };

      const canonForItem = (raw) => {
        if (!raw) return null;
        const it = sanitize(raw);

        // Plans: dedicated namespace, quantity always 1 per plan line
        if (it.kind === "plan" || it.type === "plan" || it.plan_id) {
          const billing = String(it.billing || "monthly").toLowerCase();
          const planId = String(it.plan_id || it.id || "").trim() || `plan:${norm(it.name || "")}`;
          return {
            key: `plan:${planId}:${billing}`,
            payload: {
              kind: "plan",
              plan_id: planId,
              billing,
              name: it.name || "Plan",
              price_cents: Number(it.price_cents) || 0,
              stripe_price_id: it.stripe_price_id || it.stripePriceId || null,
              quantity: 1,
            },
          };
        }

        // Deliverables: canon by DB catalog id (or fallback to normalized title), and separate by unit price
        let canonId = String(it.sku || it.id || "").trim();
        if (!canonId) {
          const t = norm(it.name || it.title);
          canonId = titleToId.get(t) || t;
        }
        const unit = Number(it.price_cents) || 0;
        return {
          key: `sku:${canonId}::unit:${unit}`,
          payload: {
            id: canonId,
            sku: canonId,
            name: it.name || it.title || "",
            description: it.description || "",
            icon: it.icon || "",
            price_cents: unit,
            quantity: Math.max(1, Number(it.quantity) || 1),
            stripe_price_id: it.stripe_price_id || it.stripePriceId || null,
          },
        };
      };

      const mergeLines = (base, incoming) => {
        const map = new Map(); // key -> payload
        const add = (arr) => {
          for (const r of arr || []) {
            const c = canonForItem(r);
            if (!c) continue;
            const prev = map.get(c.key);
            if (c.payload.kind === "plan") {
              // Last one wins per (plan_id + billing)
              map.set(c.key, { ...c.payload });
            } else if (prev) {
              prev.quantity += c.payload.quantity;
              prev.name = c.payload.name || prev.name;
              prev.description = c.payload.description || prev.description;
              prev.icon = c.payload.icon || prev.icon;
            } else {
              map.set(c.key, { ...c.payload });
            }
          }
        };
        add(base);
        add(incoming);
        return Array.from(map.values());
      };
      // ------------------------------

      let nextItems;
      if (mode === "clear") {
        nextItems = [];
      } else if (mode === "replace") {
        nextItems = (rawItems || []).map(sanitize).map(r => (canonForItem(r)?.payload)).filter(Boolean);
      } else {
        // merge (default). If incoming empty => preserve current
        nextItems = (Array.isArray(rawItems) && rawItems.length > 0)
          ? mergeLines(currentItems, rawItems)
          : currentItems;
      }

      await db.query(
        `
        INSERT INTO public.carts (client_id, items, updated_at)
        VALUES ($1, $2::jsonb, NOW())
        ON CONFLICT (client_id)
        DO UPDATE SET items = EXCLUDED.items, updated_at = NOW();
        `,
        [client_id, JSON.stringify(nextItems)]);

      return res.status(200).json({
        ok: true,
        client_id,
        mode,
        count: Array.isArray(nextItems) ? nextItems.length : 0,
        items: nextItems,
      });
    } finally {
      db.release();
      
    }
  } catch (e) {
    console.error("save-cloud-cart error:", e?.stack || e?.message || String(e));
    return res.status(500).json({ error: "Internal Server Error" });
  }
}

