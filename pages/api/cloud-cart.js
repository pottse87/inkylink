import { getPool } from '../../lib/db.mjs';

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const client_id = url.searchParams.get("client_id");
    if (!client_id) return res.status(400).json({ error: "client_id required" });

    const pool = await getPool();
const db = await pool.connect();
    try {
      const r = await db.query("SELECT items FROM public.carts WHERE client_id=$1", [client_id]);
      const items = Array.isArray(r.rows?.[0]?.items) ? r.rows[0].items : [];
      return res.status(200).json({ ok:true, items });
    } finally {
      db.release(); 
    }
  } catch (e) {
    console.error("cloud-cart GET error:", e?.message || e);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}


