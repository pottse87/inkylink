let _pool;
function getPool() {
  if (_pool) return _pool;
  // Lazy require to avoid crashing at import time
  const { Pool } = require("pg");
  const cs = process.env.DATABASE_URL;
  if (!cs) {
    const err = new Error("Missing DATABASE_URL");
    err.status = 500;
    throw err;
  }
  _pool = new Pool({
    connectionString: cs,
    ssl: { rejectUnauthorized: false },
  });
  return _pool;
}

function requireJson(req) {
  if (!req.headers["content-type"]?.includes("application/json")) {
    const err = new Error("Expected application/json");
    err.status = 415;
    throw err;
  }
}

async function readJson(req) {
  return await new Promise((resolve, reject) => {
    let buf = "";
    req.on("data", c => (buf += c));
    req.on("end", () => { try { resolve(buf ? JSON.parse(buf) : {}); } catch (e) { reject(e); } });
    req.on("error", reject);
  });
}

async function fetchCatalogRows(client, ids) {
  if (ids.length === 0) return [];
  const q = `
    SELECT id, name, price_cents
    FROM public.catalog
    WHERE id = ANY($1::text[])
  `;
  const { rows } = await client.query(q, [ids]);
  return rows;
}

export default async function handler(req, res) {
  let client;
  try {
    if (req.method !== "POST") { res.setHeader("Allow", "POST"); return res.status(405).end("Method Not Allowed"); }
    requireJson(req);
    const body = await readJson(req);

    const clientId = String(body.clientId || "").trim();
    const incoming  = Array.isArray(body.items) ? body.items : [];
    if (!clientId) return res.status(400).json({ error: "clientId required" });

    const pool = getPool();
    client = await pool.connect();

    if (incoming.length === 0) {
      await client.query(
        `INSERT INTO public.carts (client_id, items, updated_at)
         VALUES ($1, '[]'::jsonb, NOW())
         ON CONFLICT (client_id)
         DO UPDATE SET items = EXCLUDED.items, updated_at = NOW()`,
        [clientId]
      );
      return res.status(200).json({ ok: true, items: [] });
    }

    const ids = incoming.map(i => String(i.id ?? i.sku ?? "")).filter(Boolean);
    await client.query("BEGIN");
    const catalog = await fetchCatalogRows(client, ids);
    const catalogById = new Map(catalog.map(r => [String(r.id), r]));

    const merged = incoming.map(i => {
      const id = String(i.id ?? i.sku ?? "");
      const cat = catalogById.get(id) || {};
      return {
        id,
        qty: Number(i.qty || 1),
        name: cat.name ?? i.name ?? null,
        price_cents: Number(cat.price_cents ?? i.price_cents ?? 0)
      };
    });

    await client.query(
      `INSERT INTO public.carts (client_id, items, updated_at)
       VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (client_id)
       DO UPDATE SET items = EXCLUDED.items, updated_at = NOW()`,
      [clientId, JSON.stringify(merged)]
    );
    await client.query("COMMIT");
    return res.status(200).json({ ok: true, items: merged });
  } catch (err) {
    try { if (client) await client.query("ROLLBACK"); } catch {}
    // Always return JSON so we can see the real error
    return res.status(err?.status || 500).json({
      error: String(err?.message || err),
      code: err?.code || null,
      detail: err?.detail || null,
      hint: err?.hint || null,
      where: "save-cloud-cart",
    });
  } finally {
    if (client) client.release();
  }
}

