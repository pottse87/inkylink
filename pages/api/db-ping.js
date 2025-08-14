import { pool } from "../../lib/db";
export default async function handler(req, res) {
  try {
    const { rows } = await pool.query("SELECT 1 as ok");
    return res.status(200).json({ ok: rows[0]?.ok === 1 });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
