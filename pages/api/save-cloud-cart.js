import { pool } from "../../lib/db";

function requireJson(req) {
  if (req.headers["content-type"]?.includes("application/json")) return;
  throw Object.assign(new Error("Content-Type must be application/json"), { status: 415 });
}

function assert(v, msg, code = 400) {
  if (!v) throw Object.assign(new Error(msg), { status: code });
}

const normalizeItem = (it) => {
  if (!it || typeof it !== "object") return null;
  const id = String(it.id || "").trim();
  const quantity = Number.isFinite(+it.quantity) && +it.quantity > 0 ? Math.floor(+it.quantity) : 1;
  return {
    id,
    // client-sent name/icon/description are ignored for price/validation, but we keep them for UX if catalog lacks fields
    name: String(it.name || "").trim(),
    description: String(it.description || "").trim(),
    icon: String(it.icon || "").trim(),
    quantity
  };
};

async function fetchCatalogRows(client, ids) {
  if (ids.length === 0) return [];
  const q = `
    SELECT id, title, name, description, price, icon
    FROM catalog_items
    WHERE id = ANY($1)
  `;
  const { rows } = await client.query(q, [ids]);
  return rows;
}

function mergeById(existing, incoming) {
  const map = new Map();
  for (const it of existing) map.set(it.id, { ...it });

  for (const add of incoming) {
    const prev = map.get(add.id);
    if (prev) {
      // Overwrite old data with new data and add quantities
      map.set(add.id, {
        ...prev,
        ...add,
        quantity: Math.max(
          1,
          (Number(prev.quantity) || 1) + (Number(add.quantity) || 1)
        ),
      });
    } else {
      map.set(add.id, { ...add });
    }
  }
  return Array.from(map.values());
}

export default async function handler(req, res) {
  const client = await pool.connect();
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", ["POST"]);
      return res.status(405).json({ error: "Method not allowed" });
    }
    requireJson(req);
const { client_id, items } = req.body || {};
assert(client_id && typeof client_id === "string", "client_id is required");

// If caller sends an empty cart, clear it in DB and return immediately
const incomingRaw = Array.isArray(items) ? items : [];
if (incomingRaw.length === 0) {
  await client.query(
    `INSERT INTO carts (client_id, items, updated_at)
     VALUES ($1, '[]'::jsonb, NOW())
     ON CONFLICT (client_id)
     DO UPDATE SET items = '[]'::jsonb, updated_at = NOW()`,
    [client_id]
  );
  return res.status(200).json({ ok: true, items: [] });
}

// otherwise, normalize + validate
const incoming = incomingRaw.map(normalizeItem).filter(Boolean);
assert(incoming.length > 0, "items array is required and must be non-empty");

    // Validate against catalog (server is source of truth)
    const ids = incoming.map(i => i.id);
    await client.query("BEGIN");
    const catalog = await fetchCatalogRows(client, ids);
    const catalogById = new Map(catalog.map(r => [String(r.id), r]));

    const validated = incoming
      .filter(i => catalogById.has(i.id))
      .map(i => {
        const row = catalogById.get(i.id);
        const display = (row.title && String(row.title).trim()) || (row.name && String(row.name).trim()) || i.name || "";
        return {
          id: i.id,
          // ✅ front-end uses `name`; mirror from title/name
          name: display,
          // keep canonical title too (optional; harmless in cart json)
          title: row.title || null,
          description: row.description || i.description || "",
          icon: row.icon || i.icon || "",
          // price in your schema is numeric dollars; store cents for math consistency
          price_cents: Math.round(Number(row.price) * 100),
          quantity: i.quantity || 1
        };
      });

    assert(validated.length > 0, "No valid items after catalog validation");

    // Upsert + merge
    const { rows: existingRows } = await client.query(
      "SELECT items FROM carts WHERE client_id = $1",
      [client_id]
    );
    const existing = existingRows[0]?.items || [];
    const merged = mergeById(existing, validated);

    await client.query(
      `INSERT INTO carts (client_id, items, updated_at)
       VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (client_id)
       DO UPDATE SET items = $2::jsonb, updated_at = NOW()`,
      [client_id, JSON.stringify(merged)]
    );
    await client.query("COMMIT");

    return res.status(200).json({ ok: true, items: merged });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    const code = err.status || 500;
    return res.status(code).json({ error: err.message || "Internal error" });
  } finally {
    client.release();
  }
}
