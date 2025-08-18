import fs from "fs";
import path from "path";

function getOrdersDir() {
  const prefs = [
    process.env.ORDERS_DIR,
    path.join(process.cwd(), ".orders"),
  ].filter(Boolean);

  for (const d of prefs) {
    try {
      fs.mkdirSync(d, { recursive: true });
      return d;
    } catch {}
  }
  const fallback = path.join(process.cwd(), ".orders");
  try { fs.mkdirSync(fallback, { recursive: true }); } catch {}
  return fallback;
}

export default async function handler(req, res) {
  try {
    const clientId = String(req.query.client_id || "").trim();
    if (!clientId) { res.status(400).json({ error: "missing client_id" }); return; }

    const dir = getOrdersDir();
    if (!fs.existsSync(dir)) { res.status(404).json({ error: "orders dir missing" }); return; }

    const files = fs.readdirSync(dir)
      .filter(f => f.toLowerCase().endsWith(".json"))
      .map(f => {
        const full = path.join(dir, f);
        let m = 0;
        try { m = fs.statSync(full).mtimeMs; } catch {}
        return { f, full, m };
      })
      .sort((a, b) => b.m - a.m);

    for (const rec of files) {
      try {
        const txt = fs.readFileSync(rec.full, "utf8");
        const json = JSON.parse(txt);
        const candidate =
          json.client_id ||
          json?.assistant_output?.client_id ||
          json?.order?.client_id;
        if (candidate === clientId) {
          res.status(200).json({ ok: true, order: json, file: rec.f });
          return;
        }
      } catch {}
    }

    res.status(404).json({ error: "no order found for client_id" });
  } catch (e) {
    console.error("orders/latest error:", e);
    res.status(500).json({ error: "failed" });
  }
}


