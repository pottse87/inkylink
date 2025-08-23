"use strict";
const { getPool } = require("../../../lib/db.js");

export default async function handler(req, res) {
  if (req.method !== "GET") { res.setHeader("Allow","GET"); return res.status(405).json({ error:"Method Not Allowed" }); }
  const clientId = String(req.query.client_id ?? req.query.clientId ?? "").trim();
  if (!clientId) return res.status(400).json({ error: "client_id required" });

  const pool = getPool();
  try {
    const { rows } = await pool.query(
      `SELECT id, total_cents, currency, status, created_at
         FROM public.orders
        WHERE client_id = $1
        ORDER BY created_at DESC
        LIMIT 1`,
      [clientId]
    );
    if (!rows.length) return res.status(404).json({ error: "no order found for client_id" });
    return res.status(200).json({ ok:true, order: rows[0] });
  } catch (e) {
    return res.status(500).json({ error: e.message || String(e) });
  }
}
