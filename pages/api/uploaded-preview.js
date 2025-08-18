import { assertLocalOnly } from '../../lib/local-paths.js';
import fs from "fs";
import path from "path";
import { getUploadDir } from "../../lib/storage";

const MIME_BY_EXT = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
};

export default async function handler(req, res) {
  try { assertLocalOnly(); } catch (e) { return res.status(e.status || 501).json({ ok: false, error: e.message }); }

  try {
    const key = String(req.query.key || "");
    if (!key || key.includes("/") || key.includes("\\")) {
      res.status(400).json({ error: "Bad key" });
      return;
    }
    const dir = getUploadDir();
    const filePath = path.join(dir, key);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    const ext = path.extname(key).toLowerCase();
    const mime = MIME_BY_EXT[ext] || "application/octet-stream";
    if (!mime.startsWith("image/")) {
      // Only serve images here
      res.status(415).json({ error: "Preview only supports images" });
      return;
    }
    const stat = fs.statSync(filePath);
    res.setHeader("Content-Type", mime);
    res.setHeader("Content-Length", String(stat.size));
    res.setHeader("Cache-Control", "public, max-age=600, immutable");
    fs.createReadStream(filePath).pipe(res);
  } catch (e) {
    console.error("uploaded-preview error:", e);
    res.status(500).json({ error: "Preview failed" });
  }
}




