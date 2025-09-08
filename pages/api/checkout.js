import { withClient } from '../../lib/db';

"use strict";

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
        [clientId]);
      const items = Array.isArray(cartRows[0]?.items) ? cartRows[0].items : [];
      if (items.length === 0) { await db.query("ROLLBACK"); throw new Error("cart is empty"); }

      const total = items.reduce((s,i) => {
        const cents = Math.max(0, Number(i?.price_cents) || 0);
        const qty   = Math.max(1, Math.floor(Number(i?.quantity) || 1));
        return s + (cents * qty);
      }, 0);

      const { rows: ordRows } = await db.query(
        `INSERT INTO public.orders (id, client_id, total_cents, currency, status, source, created_at, updated_at)
         VALUES (gen_random_uuid(), $1, $2, 'usd', 'submitted', $3, NOW(), NOW())
         RETURNING id`,
        [clientId, total, sessionId ? "stripe" : "web"]);
      const orderId = ordRows[0].id;

      for (const it of items) {
        await db.query(
          `INSERT INTO public.order_items (order_id, item_id, name, price_cents, quantity, meta)
           VALUES ($1,$2,$3,$4,$5,$6::jsonb)`, [orderId,
       it.id,
       it.name ?? null,
       Math.max(0, Number(it?.price_cents) || 0),
       Math.max(1, Math.floor(Number(it?.quantity) || 1)),
       JSON.stringify({ description: it?.description ?? "", icon: it?.icon ?? "" })
     ]);
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









