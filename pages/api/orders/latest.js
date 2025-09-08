/**
 * pages/api/orders/latest.js
 * GET ?client_id=<uuid>
 * Returns the most recent order for a client (by created_at desc if present, else id desc),
 * including uploaded_files from orders.metadata (if present). Never 500s the UX.
 */
import { getPool } from "../../../lib/db.mjs";

const isProd = process.env.NODE_ENV === "production";
const isUuid = (s) =>
  typeof s === "string" &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // headers
  res.setHeader("Cache-Control", isProd ? "public, max-age=60, s-maxage=60" : "no-store");
  res.setHeader("X-Robots-Tag", "noindex");

  const client_id = String(req.query?.client_id || "").trim();
  if (!isUuid(client_id)) {
    // soft-fail: keeps UI alive
    return res.status(200).json({ ok: true, order: null, degraded: true, reason: "bad_client_id" });
  }

  try {
    const pool = await getPool();

    // Detect created_at column to avoid breaking if absent
    const col = await pool.query(`
      select 1 from information_schema.columns
       where table_schema='public' and table_name='orders' and column_name='created_at'
    `);
    const orderClause = col.rowCount ? `created_at desc nulls last, id desc` : `id desc`;

    // Pull minimal safe fields + metadata (jsonb)
    const q = await pool.query(
      `
      select id::text as id,
             client_id::text as client_id,
             coalesce(metadata, '{}'::jsonb) as metadata
        from public.orders
       where client_id = $1
       order by ${orderClause}
       limit 1
      `,
      [client_id]
    );

    if (!q.rows[0]) {
      return res.status(200).json({ ok: true, order: null });
    }

    const row = q.rows[0];
    const md  = row.metadata || {};
    const uploaded = Array.isArray(md.uploaded_files) ? md.uploaded_files : [];

    return res.status(200).json({
      ok: true,
      order: {
        id: row.id,
        client_id: row.client_id,
        uploaded_files: uploaded,
      }
    });
  } catch (e) {
    console.error(JSON.stringify({ where: "api/orders/latest", error: e?.message || String(e) }));
    return res.status(200).json({ ok: true, order: null, degraded: true, reason: "exception" });
  }
}

