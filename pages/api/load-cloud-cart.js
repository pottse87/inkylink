import { getPool } from '../../lib/db.mjs';

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  const client_id = String(req.query.client_id || "").trim();
  if (!client_id) return res.status(400).json({ error: "client_id required" });

  try {
    const pool = await getPool();
const db = await pool.connect();
    try {
      await db.query(`
        CREATE TABLE IF NOT EXISTS public.carts (
          client_id  text  PRIMARY KEY,
          items      jsonb NOT NULL DEFAULT '[]'::jsonb,
          updated_at timestamptz NOT NULL DEFAULT NOW());
      `);
      const r = await db.query(`SELECT items FROM public.carts WHERE client_id=$1`, [client_id]);
      const items = Array.isArray(r.rows?.[0]?.items) ? r.rows[0].items : [];
      const total_cents = items.reduce((s,i) => s + (Number(i.price_cents)||0) * Math.max(1, Math.floor(Number(i.quantity)||1)), 0);
      return res.status(200).json({ ok: true, client_id, count: items.length, total_cents, items });
    } finally {
      db.release(); 
    }
  } catch (e) {
    console.error("load-cloud-cart error:", e?.message || e);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}


