import { getPool } from '../../../../lib/db';

"use strict";

const TOKEN = process.env.INKYLINK_DESKTOP_TOKEN || "";
const ALLOWED = new Set(["queued","processing","completed","canceled","failed","paid","submitted","error","unknown"]);
const EVENT_TYPE = "status_update";

function normalizeStatus(s) {
  const x = String(s || "").toLowerCase().trim();
  if (x === "cancelled") return "canceled";
  return x;
}

async function handler(req, res) {
  if (req.method !== "PATCH") {
    res.setHeader("Allow","PATCH");
    return res.status(405).json({ error:"Method Not Allowed" });
  }

  const headerToken = String(req.headers["x-desktop-token"] || "").trim();
  const envToken = String(TOKEN || "").trim();
  if (!envToken || headerToken !== envToken) {
    return res.status(401).json({ error:"unauthorized" });
  }

  const id = String((req.query && req.query.id) || "").trim();
  const body = (req.body && typeof req.body === "object") ? req.body : {};
  const status = normalizeStatus(body.status);
  const note = (body.note != null) ? String(body.note) : "";

  if (!id) return res.status(400).json({ error: "id required" });
  if (!ALLOWED.has(status)) return res.status(400).json({ error: "invalid status" });

  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const up = await client.query(
      "UPDATE public.orders SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING id",
      [status, id]
    );
    if (up.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "order not found" });
    }

    await client.query(
      "INSERT INTO public.order_events (order_id, event_type, status, note) VALUES ($1,$2,$3,$4)",
      [id, EVENT_TYPE, status, note]
    );

    await client.query("COMMIT");
    return res.status(200).json({ ok:true, id, status });
  } catch (e) {
    try { await client.query("ROLLBACK"); } catch {}
    return res.status(500).json({ error: e.message || String(e) });
  } finally {
    client.release();
  }
}
export default handler;

