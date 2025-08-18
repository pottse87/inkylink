import fs from "node:fs";
import path from "node:path";

const isCloud = process.env.VERCEL === "1" || !!process.env.VERCEL_URL;

function requireLocalPath(varName) {
  const raw = (process.env[varName] || "").trim();
  if (!raw) throw new Error(`${varName} is not set`);

  if (isCloud) {
    const e = new Error(`${varName} is local-only and not allowed in cloud`);
    e.status = 501; // Not Implemented (unavailable on Vercel)
    throw e;
  }

  const resolved = path.resolve(raw);
  if (!fs.existsSync(resolved)) fs.mkdirSync(resolved, { recursive: true });
  return resolved;
}

export function getUploadDir() { return requireLocalPath("UPLOAD_DIR"); }
export function getOrdersDir() { return requireLocalPath("ORDERS_DIR"); }

export function assertLocalOnly() {
  if (isCloud) {
    const e = new Error("This operation is local-only");
    e.status = 501;
    throw e;
  }
}
