"use strict";
const { withClient } = require("../../lib/db.js");

function bad(res, msg, code=400) { return res.status(code).json({ ok:false, error: msg }); }
function jsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  try { return req.body ? JSON.parse(req.body) : {}; } catch { return {}; }
}

export default async function handler(req, res) {
  if (req.method !== "POST") { res.setHeader("Allow","POST"); return bad(res,"Method Not Allowed",405); }
  const body = jsonBody(req);
  const clientId = String(body.client_id ?? body.clientId ?? "").trim();
  const sessionId = body.session_id ? String(body.session_id) : null;
  if (!clientId) return bad(res, "client_id is required");

  try {
    const { order_id, total_cents } = await withClient(async (db) => {
      await db.query("BEGIN");

      const { rows: cartRows } = await db.query(
        "SELECT items FROM public.carts WHERE client_id = $1",
        [clientId]
      );
      const items = Array.isArray(cartRows[0]?.items) ? cartRows[0].items : [];
      if (items.length === 0) { await db.query("ROLLBACK"); throw new Error("cart is empty"); }

      const total = items.reduce((s,i)=> s + (Number(i.price_cents)||0) * (Number(i.quantity)||1), 0);

      const { rows: ordRows } = await db.query(
        `INSERT INTO public.orders (id, client_id, total_cents, currency, status, source, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, 'usd', 'queued', $3, NOW(), NOW())
         RETURNING id`,
        [clientId, total, sessionId ? "stripe" : "web"]
      );
      const orderId = ordRows[0].id;

      for (const it of items) {
        await db.query(
          `INSERT INTO public.order_items (order_id, item_id, name, price_cents, quantity, meta)
           VALUES ($1,$2,$3,$4,$5,'{}'::jsonb)`,
          [orderId, it.id, it.name ?? null, Number(it.price_cents)||0, Number(it.quantity)||1]
        );
      }

      // CRITICAL FIX: Commit first, THEN delete cart
      await db.query("COMMIT");
      
      // Only delete cart after successful commit
      await db.query(`DELETE FROM public.carts WHERE client_id = $1`, [clientId]);

      return { order_id: orderId, total_cents: total };
    });

    return res.status(200).json({ ok: true, order_id, total_cents, status: "queued" });
  } catch (err) {
    return res.status(400).json({ ok:false, error: err.message || String(err) });
  }
}
