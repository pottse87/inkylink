import { appendLogLineSafe } from "../../lib/localFS";

export default async function handler(req, res) {
  try {
    const msg = (req.body && (req.body.message || req.body.msg)) || "unknown";
    appendLogLineSafe(String(msg));
    res.status(200).json({ ok: true });
  } catch {
    res.status(200).json({ ok: true });
  }
}
