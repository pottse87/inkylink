import fs from "fs";
import path from "path";
import formidable from "formidable";
import { makeKeyFromBuffer, saveBufferToStorage } from "../../lib/storage";

export const config = {
  api: { bodyParser: false, sizeLimit: "26mb" }
};

const ALLOWED = new Set(["image/png", "image/jpeg", "application/pdf"]);
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

function rmSafe(p) { try { fs.existsSync(p) && fs.unlinkSync(p); } catch {} }

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }
  try {
    const form = formidable({
      multiples: true,
      maxFileSize: MAX_FILE_SIZE,
      filter: (part) => Boolean(part.mimetype && ALLOWED.has(part.mimetype)),
    });

    const { files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, fields, files) => err ? reject(err) : resolve({ fields, files }));
    });

    const picked = []
      .concat(files?.file || [])
      .concat(files?.files || [])
      .filter(Boolean);

    if (!picked.length) {
      res.status(400).json({ error: "No files uploaded or invalid file types." });
      return;
    }

    const results = [];
    for (const f of picked) {
      const file = Array.isArray(f) ? f[0] : f;
      const tmpPath = file.filepath || file.path;
      const mime = file.mimetype || "application/octet-stream";
      const originalName = file.originalFilename || file.newFilename || "upload";

      if (!ALLOWED.has(mime)) { rmSafe(tmpPath); res.status(415).json({ error: `Unsupported media type: ${mime}` }); return; }
      const stat = fs.statSync(tmpPath);
      if (stat.size > MAX_FILE_SIZE) { rmSafe(tmpPath); res.status(413).json({ error: "File exceeds 25MB limit." }); return; }

      const ext = path.extname(originalName) || (mime === "image/png" ? ".png" : mime === "image/jpeg" ? ".jpg" : mime === "application/pdf" ? ".pdf" : "");
      const buffer = fs.readFileSync(tmpPath);
      const key = makeKeyFromBuffer(buffer, ext);
      const stored = await saveBufferToStorage(key, buffer);
      rmSafe(tmpPath);

      results.push({ key: stored.key, size: buffer.length, mime, name: originalName });
    }

    res.status(200).json({ ok: true, files: results });
  } catch (err) {
    console.error("upload error:", err);
    res.status(500).json({ error: "Upload failed." });
  }
}
