#!/usr/bin/env node
"use strict";
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

function resolveDbUrl() {
  let url = process.env.DATABASE_URL || "";
  if (!url) {
    try {
      const envPath = path.join(process.cwd(), ".env.local");
      if (fs.existsSync(envPath)) {
        const txt = fs.readFileSync(envPath, "utf8");
        const m = txt.match(/^\s*DATABASE_URL\s*=\s*(.+)\s*$/m);
        if (m) url = m[1].trim();
      }
    } catch {}
  }
  if (url.startsWith("postgresql://")) url = "postgres://" + url.slice("postgresql://".length);
  return url;
}
const DB_URL = resolveDbUrl();
if (!DB_URL) { console.error("DATABASE_URL missing"); process.exit(1); }

const pool = new Pool({ connectionString: DB_URL, ssl: (process.env.PGSSLMODE==="disable"||process.env.DB_SSL==="0"||process.env.DB_SSL==="false") ? false : { rejectUnauthorized: false } });

(async () => {
  const c = await pool.connect();
  try {
    const q = async (sql, params=[]) => (await c.query(sql, params)).rows;
    const exists = async (t) => !!(await q("select to_regclass($1) reg",[t.includes(".")?t:`public.${t}`]))[0].reg;
    const col = async (t, colName) => {
      const [sch, name] = t.includes(".") ? t.split(".") : ["public", t];
      return (await q(
        `select 1 from information_schema.columns where table_schema=$1 and table_name=$2 and column_name=$3`,
        [sch,name,colName]
      )).length>0;
    };

    const out = {};

    if (await exists("orders")) {
      out.orders = (await q(`
        select
          count(*)::int as total,
          count(*) filter (where total_cents is null)::int as null_total_cents,
          count(*) filter (where total_cents < 0)::int as negative_total_cents
        from public.orders
      `))[0];
    }
    if (await exists("order_items")) {
      out.order_items = (await q(`
        select
          count(*)::int as total,
          count(*) filter (where price_cents is null)::int as null_price_cents,
          count(*) filter (where price_cents < 0)::int as negative_price_cents,
          count(*) filter (where quantity < 1)::int as bad_quantity
        from public.order_items
      `))[0];
    }
    if (await exists("carts")) {
      out.carts = (await q(`
        select
          count(*)::int as carts,
          coalesce(sum(jsonb_array_length(items)),0)::int as item_count
        from public.carts
      `))[0];
    }
    if (await exists("catalog_items") && await col("catalog_items","price_cents")) {
      out.catalog_items = (await q(`
        select
          count(*)::int as total,
          count(*) filter (where price_cents is null)::int as null_price_cents,
          count(*) filter (where price_cents < 0)::int as negative_price_cents
        from public.catalog_items
      `))[0];
    }
    if (await exists("order_events")) {
      out.order_events = (await q(`
        select
          count(*)::int as total,
          count(*) filter (where status is null)::int as null_status
        from public.order_events
      `))[0];
    }

    out.legacy_columns = {};
    const legacy = [
      ["public.orders","total"],["public.orders","grand_total"],["public.orders","subtotal"],
      ["public.order_items","price"],["public.order_items","amount"],["public.order_items","total"],
      ["public.catalog_items","price"]
    ];
    for (const [t, cName] of legacy) {
      out.legacy_columns[`${t}.${cName}`] = (await col(t, cName)) ? "PRESENT (needs drop)" : "OK (not found)";
    }

    const outFile = path.join(process.cwd(), "verify-db.json");
    fs.writeFileSync(outFile, JSON.stringify(out, null, 2));
    console.log("Wrote", outFile);
  } finally {
    c.release();
    await pool.end();
  }
})();

