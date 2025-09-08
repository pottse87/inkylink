import { getPool } from '../../../lib/db';


export default async function handler(req, res) {
  try {
    const id = String(req.query.id || "").trim();
    if (!id) return res.status(400).json({ error: "id required" });

    const cs = process.env.DATABASE_URL;
    if (!cs) return res.status(500).json({ error: "DATABASE_URL not configured" });

    const pool = getPool()
        ? false : { rejectUnauthorized: false }
    });
    const db = await pool.connect();
    try {
      const r = await db.query(
        `select id,status,total_cents,currency,stripe_session_id,updated_at
           from public.orders where id=$1`, [id]);
      if (!r.rows[0]) return res.status(404).json({ error: "not found" });
      return res.status(200).json(r.rows[0]);
    } finally { db.release();  }
  } catch (e) {
    return res.status(500).json({ error: "Internal Server Error" });
  }
}




