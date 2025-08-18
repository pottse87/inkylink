import { getPool } from "lib/db.js"; const pool = getPool();

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method not allowed" });
  }
  const client_id = String(req.query.client_id || "").trim();
  if (!client_id) return res.status(400).json({ error: "client_id is required" });

  const { rows } = await pool.query("SELECT items, updated_at FROM carts WHERE client_id = $1", [client_id]);
  const items = rows[0]?.items || [];
  return res.status(200).json({ items, updated_at: rows[0]?.updated_at || null });
}


