import { readRecentOrdersSafe } from "../../lib/localFS";

export default async function handler(req, res) {
  try {
    const limit = Math.max(1, Math.min(200, Number(req.query?.limit) || 50));
    const items = readRecentOrdersSafe(limit);
    res.status(200).json({ items });
  } catch (err) {
    console.error("get-previous-orders error:", err?.message || err);
    res.status(200).json({ items: [] });
  }
}



