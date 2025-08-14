import fs from "fs";
import path from "path";
import crypto from "crypto";

export function getUploadDir() {
  const prefs = [
    process.env.UPLOAD_DIR,
    process.env.LOCAL_UPLOAD_PATH,
    path.join(process.cwd(), ".uploads"),
  ].filter(Boolean);

  for (const d of prefs) {
    try { fs.mkdirSync(d, { recursive: true }); return d; } catch {}
  }
  const local = path.join(process.cwd(), ".uploads");
  try { fs.mkdirSync(local, { recursive: true }); } catch {}
  return local;
}

export function makeKeyFromBuffer(buffer, ext) {
  const hash = crypto.createHash("md5").update(buffer).digest("hex");
  const ts = Date.now();
  const safeExt = (ext || "").toLowerCase().replace(/[^a-z0-9.]/g, "");
  return `${hash}_${ts}${safeExt}`;
}

export async function saveBufferToStorage(key, buffer) {
  const dir = getUploadDir();
  const full = path.join(dir, key);
  fs.writeFileSync(full, buffer);
  return { key, path: full, size: buffer.length };
}