"use strict";
const { getPool } = require("../../../lib/db.js");

export default async function handler(req, res) {
  if (req.method !== "GET") { res.setHeader("Allow","GET"); return res.status(405).json({ error:"Method Not Allowed" }); }
  const id = String(req.query.id ?? "").trim();
  if (!id) return res.status(400).json({ error: "id required" });

  const pool = getPool();
  try {
    const { rows: ord } = await pool.query(`SELECT * FROM public.orders WHERE id = $1`, [id]);
    if (!ord.length) return res.status(404).json({ error: "order not found" });
    const { rows: items } = await pool.query(
      `SELECT item_id, name, price_cents, quantity FROM public.order_items WHERE order_id = $1 ORDER BY id`,
      [id]
    );
    return res.status(200).json({ ok:true, order: ord[0], items });
  } catch (e) {
    return res.status(500).json({ error: e.message || String(e) });
  }
}
