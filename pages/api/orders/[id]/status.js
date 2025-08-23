"use strict";
const { getPool } = require("../../../../lib/db.js");

const TOKEN = process.env.INKYLINK_DESKTOP_TOKEN || "";
const ALLOWED = new Set(["queued","processing","completed","canceled","failed"]);

export default async function handler(req, res) {
  if (req.method !== "PATCH") { res.setHeader("Allow","PATCH"); return res.status(405).json({ error:"Method Not Allowed" }); }
  if (!TOKEN || req.headers["x-desktop-token"] !== TOKEN) return res.status(401).json({ error:"unauthorized" });

  const id = String(req.query.id ?? "").trim();
  const body = (req.body && typeof req.body === "object") ? req.body : {};
  const status = String(body.status ?? "").toLowerCase();
  const note = body.note ? String(body.note) : null;
  if (!id) return res.status(400).json({ error: "id required" });
  if (!ALLOWED.has(status)) return res.status(400).json({ error: "invalid status" });

  const pool = getPool();
  try {
    await pool.query(`UPDATE public.orders SET status=$1, updated_at=NOW() WHERE id=$2`, [status, id]);
    await pool.query(
      `INSERT INTO public.order_events (order_id, event_type, payload) VALUES ($1,$2,$3::jsonb)`,
      [id, "status", JSON.stringify({ status, note, at: new Date().toISOString() })]
    );
    return res.status(200).json({ ok:true });
  } catch (e) {
    return res.status(500).json({ error: e.message || String(e) });
  }
}
