"use strict";
const { getPool } = require("../../lib/db.js");

function badReq(res, msg, code = 400) { res.status(code).json({ ok: false, error: msg }); }
function jsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  try { return req.body ? JSON.parse(req.body) : {}; } catch { return {}; }
}

export default async function handler(req, res) {
  if (req.method !== "POST") { res.setHeader("Allow","POST"); return badReq(res,"Method Not Allowed",405); }

  const body = jsonBody(req);

  // Accept client_id or clientId
  const clientId = String(body.client_id ?? body.clientId ?? "").trim();
  if (!clientId) return badReq(res, "client_id required");

  const rawItems = Array.isArray(body.items) ? body.items : [];
  const incoming = rawItems
    .map(x => ({
      id: String(x.id ?? x.sku ?? "").trim(),
      quantity: Math.max(1, parseInt(String(x.quantity ?? x.qty ?? 1), 10) || 1),
      name: x.name ?? null,
      price_cents: Number.isFinite(+x.price_cents) ? +x.price_cents : null
    }))
    .filter(x => !!x.id);

  const pool = getPool();
  let client;
  try {
    client = await pool.connect();

    if (incoming.length === 0) {
      await client.query(
        `INSERT INTO public.carts (client_id, items, updated_at)
         VALUES ($1, '[]'::jsonb, NOW())
         ON CONFLICT (client_id)
         DO UPDATE SET items = EXCLUDED.items, updated_at = NOW()`,
        [clientId]
      );
      return res.status(200).json({ ok: true, items: [] });
    }

    // Pull catalog details
    const ids = incoming.map(i => i.id);
    const { rows: catalog } = await client.query(
      `SELECT id, title, price_cents
         FROM public.catalog_items
        WHERE id = ANY($1::text[])`,
      [ids]
    );
    const byId = new Map(catalog.map(r => [String(r.id), r]));

    const merged = incoming.map(i => {
      const cat = byId.get(i.id) || {};
      const name = i.name ?? cat.title ?? null;
      const price = Number.isFinite(+i.price_cents) ? +i.price_cents
                  : Number.isFinite(+cat.price_cents) ? +cat.price_cents
                  : 0;
      return { id: i.id, name, price_cents: price, quantity: i.quantity };
    });

    await client.query(
      `INSERT INTO public.carts (client_id, items, updated_at)
       VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (client_id)
       DO UPDATE SET items = EXCLUDED.items, updated_at = NOW()`,
      [clientId, JSON.stringify(merged)]
    );

    return res.status(200).json({ ok: true, items: merged });
  } catch (err) {
    const code = err.status || err.code === "ECONNREFUSED" ? 503 : 500;
    return res.status(code).json({ ok:false, error: err.message || String(err), where: "save-cloud-cart" });
  } finally { if (client) client.release(); }
}
