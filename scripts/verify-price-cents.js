#!/usr/bin/env node
"use strict";
const { Pool } = require("pg");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: (process.env.PGSSLMODE==="disable"||process.env.DB_SSL==="0"||process.env.DB_SSL==="false") ? false : { rejectUnauthorized: false }
});
(async () => {
  const c = await pool.connect();
  try {
    const out = {};
    const exists = async (tbl) => {
      const r = await c.query("SELECT to_regclass($1) reg", [tbl.includes(".") ? tbl : `public.${tbl}`]);
      return !!r.rows[0].reg;
    };
    const colExists = async (tbl, col) => {
      const [schema, name] = tbl.includes(".") ? tbl.split(".") : ["public", tbl];
      const r = await c.query(
        `SELECT 1 FROM information_schema.columns WHERE table_schema=$1 AND table_name=$2 AND column_name=$3`,
        [schema, name, col]
      );
      return r.rowCount > 0;
    };

    if (await exists("public.catalog_items")) {
      out.catalog_items = (await c.query(`
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE price_cents IS NULL)::int AS null_price_cents,
          COUNT(*) FILTER (WHERE price_cents < 0)::int    AS negative_price_cents
        FROM public.catalog_items
      `)).rows[0];
    }

    if (await exists("public.order_items") && await colExists("public.order_items","price_cents")) {
      out.order_items = (await c.query(`
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE price_cents IS NULL)::int AS null_price_cents,
          COUNT(*) FILTER (WHERE price_cents < 0)::int    AS negative_price_cents
        FROM public.order_items
      `)).rows[0];
    }

    if (await exists("public.orders") && await colExists("public.orders","total_cents")) {
      out.orders = (await c.query(`
        SELECT
          COUNT(*)::int AS total,
          COUNT(*) FILTER (WHERE total_cents IS NULL)::int AS null_total_cents,
          COUNT(*) FILTER (WHERE total_cents < 0)::int    AS negative_total_cents
        FROM public.orders
      `)).rows[0];
    }

    if (await exists("public.carts")) {
      out.carts = (await c.query(`
        SELECT
          COUNT(*)::int AS carts,
          COALESCE(SUM(jsonb_array_length(items)),0)::int AS item_count
        FROM public.carts
      `)).rows[0];
    }

    console.log(JSON.stringify(out, null, 2));
  } finally {
    c.release();
    await pool.end();
  }
})();

