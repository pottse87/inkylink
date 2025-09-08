/**
 * pages/api/save-order.js
 * ESM + idempotent writes + safe fallback + audit event (status when allowed)
 */
import { getPool } from "../../lib/db.mjs";

const isProd = process.env.NODE_ENV === "production";
const devLog = (...a) => { if (!isProd) console.log(...a); };

function canonicalize(v) {
  if (Array.isArray(v)) return v.map(canonicalize);
  if (v && typeof v === "object" && v.constructor === Object) {
    const o = {};
    for (const k of Object.keys(v).sort()) o[k] = canonicalize(v[k]);
    return o;
  }
  return v;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex");

  try {
    const body = (req.body && typeof req.body === "object") ? req.body : {};
    const order_id  = String(body.order_id || "");
    const client_id = String(body.client_id || "");
    const answers   = body.answers;

    if (!order_id || !client_id || !answers || typeof answers !== "object") {
      return res.status(400).json({ error: "Bad Request" });
    }

    const cx = await getPool();

    // Ownership check
    const own = await cx.query(
      "select 1 from public.orders where id=$1 and client_id=$2 limit 1",
      [order_id, client_id]
    );
    if (!own.rowCount) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Deterministic JSON string for equality
    const canonStr = JSON.stringify(canonicalize(answers));

    // Choose storage path
    const reg = await cx.query("select to_regclass('public.order_intake') as t");
    const hasIntakeTable = !!reg.rows?.[0]?.t;

    let updated = false;

    if (hasIntakeTable) {
      // Upsert with equality check
      const up = await cx.query(
        `with up as (
           insert into public.order_intake (order_id, answers)
           values ($1, $2::jsonb)
           on conflict (order_id) do update
             set answers = excluded.answers
           where public.order_intake.answers is distinct from excluded.answers
           returning 1
         )
         select count(*)::int as updated from up`,
        [order_id, canonStr]
      );
      updated = !!Number(up.rows?.[0]?.updated || 0);
    } else {
      // Fallback: orders.metadata JSONB using RETURNING for idempotent "updated"
      const upd = await cx.query(
        `update public.orders
            set metadata = coalesce(metadata,'{}'::jsonb)
                           || jsonb_build_object('intake', $2::jsonb)
          where id = $1
            and ((metadata->'intake') is distinct from $2::jsonb)
          returning 1`,
        [order_id, canonStr]
      );
      updated = upd.rowCount > 0;
    }

    // Best-effort audit event (status when constraint allows; fallback without)
    try {
      try {
        await cx.query(
          `insert into public.order_events (order_id, event_type, status, payload)
           values ($1, 'intake_saved', 'ok', $2::jsonb)`,
          [order_id, canonStr]
        );
      } catch (_e1) {
        await cx.query(
          `insert into public.order_events (order_id, event_type, payload)
           values ($1, 'intake_saved', $2::jsonb)`,
          [order_id, canonStr]
        );
      }
    } catch (e) {
      devLog("order_events insert skipped:", e?.message || String(e));
    }

    return res.status(200).json({ ok: true, updated });
  } catch (err) {
    const msg = err?.message || String(err);
    console.error(JSON.stringify({ where: "api/save-order", error: msg }));
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
