import fs from "node:fs";
import path from "node:path";

/** Returns a directory path to store orders (prefer env), never throws. */
export function getOrdersDir() {
  try {
    const base = process.env.LOCAL_ORDER_PATH || "E:\\\\inkylink\\\\orders";
    // If they accidentally point to a file, use its parent folder
    if (fs.existsSync(base)) {
      const stat = fs.statSync(base);
      if (stat.isDirectory()) return base;
      return path.dirname(base);
    }
    // Create directory if missing
    fs.mkdirSync(base, { recursive: true });
    return base;
  } catch {
    // Last-resort temp dir; desktop app will ignore this if it watches E:
    const tmp = path.join(process.cwd(), ".local-orders");
    try { fs.mkdirSync(tmp, { recursive: true }); } catch {}
    return tmp;
  }
}

/** Write one JSON file per order. Never throws (logs only). */
export function writeOrderJsonSafe(payload, basenameHint) {
  try {
    const dir = getOrdersDir();
    const base = String(basenameHint || "");
    const hint = base.replace(/[^a-z0-9_-]/gi, "").slice(0, 48);
    const fname = `${Date.now()}_${hint || Math.random().toString(36).slice(2)}.json`;
    const out = path.join(dir, fname);
    fs.writeFileSync(out, JSON.stringify(payload, null, 2), { encoding: "utf8" });
    return out;
  } catch (err) {
    console.error("Local order write failed:", err?.message || err);
    return null;
  }
}

/** Read last N JSON files from the orders directory. Never throws. */
export function readRecentOrdersSafe(limit = 50) {
  try {
    const dir = getOrdersDir();
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files = entries
      .filter((d) => d.isFile() && d.name.toLowerCase().endsWith(".json"))
      .map((d) => path.join(dir, d.name))
      .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)
      .slice(0, limit);

    const out = [];
    for (const f of files) {
      try {
        const raw = fs.readFileSync(f, "utf8");
        out.push(JSON.parse(raw));
      } catch {}
    }
    return out;
  } catch {
    return [];
  }
}

/** Append a simple log line (for log-error route). Never throws. */
export function appendLogLineSafe(line) {
  try {
    const dir = getOrdersDir();
    const log = path.join(dir, "events.log");
    fs.appendFileSync(log, `${new Date().toISOString()} ${line}\n`, { encoding: "utf8" });
  } catch {}
}