import { writeOrderJsonSafe } from "../../lib/localFS";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }
  try {
    const payload = req.body || {};
    // Minimal DB write if you have one here…
    writeOrderJsonSafe(payload, payload?.order_id || "minimal");
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("save-minimal-order error:", err?.message || err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}


