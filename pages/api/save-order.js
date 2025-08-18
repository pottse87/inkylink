import path from "path";
import fs from "fs";

const isProd = process.env.NODE_ENV === "production";

function log(...args) {
  if (!isProd) console.log("[save-order]", ...args);
}

function getOrdersDir() {
  const preferred = process.env.LOCAL_ORDER_PATH || "E:\\\\inkylink\\\\orders";
  try {
    fs.mkdirSync(preferred, { recursive: true });
    log("orders dir:", preferred);
    return preferred;
  } catch (e) {
    log("mkdir preferred failed:", e?.message || e);
  }
  const fallback = path.join(process.cwd(), ".local-orders");
  try {
    fs.mkdirSync(fallback, { recursive: true });
    log("orders dir (fallback):", fallback);
  } catch (e) {
    log("mkdir fallback failed:", e?.message || e);
  }
  return fallback;
}

function findExistingByKey(dir, key) {
  if (!key) return null;
  try {
    const files = fs.readdirSync(dir);
    const needle = `_${String(key).toLowerCase()}.json`;
    const match = files.find((name) => name.toLowerCase().endsWith(needle));
    log("findExistingByKey", { key, match });
    return match ? path.join(dir, match) : null;
  } catch (e) {
    log("readdir failed:", e?.message || e);
    return null;
  }
}

function writeOnce(dir, payload, key) {
  const ts = Date.now();
  const safeKey = String(key || "order").replace(/[^a-zA-Z0-9_-]/g, "_");
  const name = `${ts}_${safeKey}.json`;
  const full = path.join(dir, name);
  fs.writeFileSync(full, JSON.stringify(payload, null, 2));
  log("wrote file:", full);
  return full;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

  try {
    const payload = req.body || {};
    const idemKey = payload?.session_id || payload?.order_id || null;
    log("incoming", { idemKey, hasItems: Array.isArray(payload?.items) });

    const dir = getOrdersDir();

    const existing = findExistingByKey(dir, idemKey);
    if (existing) {
      log("duplicate detected:", existing);
      res.status(200).json({ ok: true, duplicate: true });
      return;
    }

    writeOnce(dir, payload, idemKey || "order");
    res.status(200).json({ ok: true });
  } catch (err) {
    const msg = err?.message || String(err);
    console.error("[save-order] error:", msg);
    res.status(500).json({
      error: "Internal Server Error",
      ...(isProd ? {} : { detail: msg })
    });
  }
}



