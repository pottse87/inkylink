import { pool } from "../../lib/db";

export default async function handler(req, res) {
  const out = {
    env: process.env.VERCEL_ENV || process.env.NODE_ENV || "development",
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    now: new Date().toISOString(),
  };
  try {
    const urlStr = process.env.DATABASE_URL || "";
    const u = urlStr ? new URL(urlStr) : null;
    out.host = u?.hostname || null;
    out.port = u?.port || null;

    const client = await pool.connect();
    try {
      await client.query("select 1"); // connectivity ok

      // does public.carts exist?
      const t = await client.query("select to_regclass('public.carts') as reg");
      out.cartsTable = !!t.rows?.[0]?.reg;

      if (out.cartsTable) {
        const cols = await client.query(`
          select column_name
          from information_schema.columns
          where table_schema='public' and table_name='carts'
          order by ordinal_position
        `);
        out.cartsColumns = cols.rows.map(r => r.column_name);
      }
    } finally {
      client.release();
    }

    res.status(200).json(out);
  } catch (e) {
    out.error = String(e?.message || e);
    res.status(500).json(out);
  }
}