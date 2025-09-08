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
try { const u=new URL(DB_URL); console.log("Connecting to:", `${u.hostname}:${u.port||"5432"}${u.pathname}`); } catch {}

const pool = new Pool({ connectionString: DB_URL, ssl: (process.env.PGSSLMODE==="disable"||process.env.DB_SSL==="0"||process.env.DB_SSL==="false") ? false : { rejectUnauthorized: false } });

async function tableExists(c, name) {
  const full = name.includes(".") ? name : `public.${name}`;
  const r = await c.query("SELECT to_regclass($1) reg", [full]);
  return !!r.rows[0].reg;
}
async function columnExists(c, tbl, col) {
  const [schema, name] = tbl.includes(".") ? tbl.split(".") : ["public", tbl];
  const r = await c.query(
    `SELECT 1 FROM information_schema.columns WHERE table_schema=$1 AND table_name=$2 AND column_name=$3`,
    [schema, name, col]
  );
  return r.rowCount > 0;
}
async function constraintExists(c, name) {
  const r = await c.query(`SELECT 1 FROM pg_constraint WHERE conname = $1`, [name]);
  return r.rowCount > 0;
}
async function indexExists(c, schema, name) {
  const r = await c.query(
    `SELECT 1 FROM pg_class i JOIN pg_namespace n ON n.oid=i.relnamespace WHERE n.nspname=$1 AND i.relname=$2`,
    [schema, name]
  );
  return r.rowCount > 0;
}

(async () => {
  const c = await pool.connect();
  try {
    await c.query("BEGIN");

    // Extensions
    await c.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`);

    // Carts
    if (!(await tableExists(c, "public.carts"))) {
      await c.query(`
        CREATE TABLE public.carts (
          client_id  text PRIMARY KEY,
          items      jsonb NOT NULL DEFAULT '[]'::jsonb,
          updated_at timestamptz NOT NULL DEFAULT now()
        )`);
    } else {
      if (!(await columnExists(c, "public.carts","client_id"))) await c.query(`ALTER TABLE public.carts ADD COLUMN client_id text`);
      if (!(await columnExists(c, "public.carts","items"))) {
        await c.query(`ALTER TABLE public.carts ADD COLUMN items jsonb`);
        await c.query(`UPDATE public.carts SET items = '[]'::jsonb WHERE items IS NULL`);
        await c.query(`ALTER TABLE public.carts ALTER COLUMN items SET NOT NULL`);
      }
      if (!(await columnExists(c, "public.carts","updated_at"))) {
        await c.query(`ALTER TABLE public.carts ADD COLUMN updated_at timestamptz`);
        await c.query(`UPDATE public.carts SET updated_at = now() WHERE updated_at IS NULL`);
        await c.query(`ALTER TABLE public.carts ALTER COLUMN updated_at SET NOT NULL`);
      }
      if (!(await indexExists(c, "public", "carts_client_id_uq"))) {
        try { await c.query(`ALTER TABLE public.carts ADD CONSTRAINT carts_client_id_uq UNIQUE (client_id)`); }
        catch {
          if (!(await indexExists(c, "public", "idx_carts_client_id_uq"))) {
            await c.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_carts_client_id_uq ON public.carts(client_id)`);
          }
        }
      }
    }
    if (await tableExists(c, "public.carts")) {
      await c.query(`
        UPDATE public.carts
        SET items = (
          SELECT jsonb_agg(
            (elem - 'price')
            || jsonb_build_object(
                 'price_cents',
                 GREATEST(
                   0,
                   COALESCE(
                     NULLIF(elem->>'price_cents','')::int,
                     CASE
                       WHEN (elem ? 'price') AND (elem->>'price') ~ '^[0-9]+(\\.[0-9]+)?$'
                         THEN ROUND( ((elem->>'price')::numeric) * 100 )::int
                       ELSE 0
                     END
                   )
                 )
               )
          )
          FROM jsonb_array_elements(items) AS elem
        )
        WHERE items IS NOT NULL
          AND jsonb_typeof(items) = 'array'
      `);
    }

    // Orders
    if (!(await tableExists(c, "public.orders"))) {
      await c.query(`
        CREATE TABLE public.orders (
          id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          client_id   text NOT NULL,
          total_cents integer NOT NULL DEFAULT 0,
          currency    text NOT NULL DEFAULT 'usd',
          status      text NOT NULL DEFAULT 'submitted',
          source      text,
          session_id  text,
          created_at  timestamptz NOT NULL DEFAULT now(),
          updated_at  timestamptz NOT NULL DEFAULT now()
        )`);
    } else {
      if (!(await columnExists(c,"public.orders","id"))) {
        await c.query(`ALTER TABLE public.orders ADD COLUMN id uuid`);
        await c.query(`UPDATE public.orders SET id = gen_random_uuid() WHERE id IS NULL`);
        try { await c.query(`ALTER TABLE public.orders ADD PRIMARY KEY (id)`); } catch {}
      }
      for (const [name, type] of [
        ["client_id","text"],["total_cents","integer"],["currency","text"],["status","text"],
        ["source","text"],["session_id","text"],["created_at","timestamptz"],["updated_at","timestamptz"]
      ]) {
        if (!(await columnExists(c,"public.orders",name))) {
          await c.query(`ALTER TABLE public.orders ADD COLUMN ${name} ${type}`);
        }
      }
      await c.query(`ALTER TABLE public.orders ALTER COLUMN currency SET DEFAULT 'usd'`);
      await c.query(`UPDATE public.orders SET currency='usd' WHERE currency IS NULL`);
      await c.query(`ALTER TABLE public.orders ALTER COLUMN currency SET NOT NULL`);

      await c.query(`UPDATE public.orders SET status='submitted' WHERE status IS NULL`);
      await c.query(`ALTER TABLE public.orders ALTER COLUMN status SET NOT NULL`);

      await c.query(`ALTER TABLE public.orders ALTER COLUMN total_cents TYPE integer USING COALESCE(ROUND(total_cents)::int,0)`);
      await c.query(`UPDATE public.orders SET total_cents = 0 WHERE total_cents IS NULL`);
      await c.query(`ALTER TABLE public.orders ALTER COLUMN total_cents SET DEFAULT 0`);
      await c.query(`ALTER TABLE public.orders ALTER COLUMN total_cents SET NOT NULL`);

      await c.query(`UPDATE public.orders SET created_at=now() WHERE created_at IS NULL`);
      await c.query(`UPDATE public.orders SET updated_at=now() WHERE updated_at IS NULL`);
      await c.query(`ALTER TABLE public.orders ALTER COLUMN created_at SET NOT NULL`);
      await c.query(`ALTER TABLE public.orders ALTER COLUMN updated_at SET NOT NULL`);

      await c.query(`ALTER TABLE public.orders DROP COLUMN IF EXISTS total`);
      await c.query(`ALTER TABLE public.orders DROP COLUMN IF EXISTS grand_total`);
      await c.query(`ALTER TABLE public.orders DROP COLUMN IF EXISTS subtotal`);
    }
    if (!(await indexExists(c, "public", "idx_orders_status"))) {
      await c.query(`CREATE INDEX idx_orders_status ON public.orders(status)`);
    }

    // Order items
    if (!(await tableExists(c, "public.order_items"))) {
      await c.query(`
        CREATE TABLE public.order_items (
          order_id    uuid    NOT NULL,
          item_id     text,
          name        text,
          price_cents integer NOT NULL DEFAULT 0,
          quantity    integer NOT NULL DEFAULT 1,
          meta        jsonb   NOT NULL DEFAULT '{}'::jsonb
        )`);
    } else {
      for (const [name, type] of [
        ["order_id","uuid"],["item_id","text"],["name","text"],
        ["price_cents","integer"],["quantity","integer"],["meta","jsonb"]
      ]) {
        if (!(await columnExists(c,"public.order_items",name))) {
          await c.query(`ALTER TABLE public.order_items ADD COLUMN ${name} ${type}`);
        }
      }
      await c.query(`ALTER TABLE public.order_items ALTER COLUMN price_cents TYPE integer USING COALESCE(ROUND(price_cents)::int,0)`);
      await c.query(`UPDATE public.order_items SET price_cents = GREATEST(0, COALESCE(price_cents,0))`);
      await c.query(`ALTER TABLE public.order_items ALTER COLUMN price_cents SET DEFAULT 0`);
      await c.query(`ALTER TABLE public.order_items ALTER COLUMN price_cents SET NOT NULL`);

      await c.query(`UPDATE public.order_items SET quantity = GREATEST(1, COALESCE(quantity,1))`);
      await c.query(`ALTER TABLE public.order_items ALTER COLUMN quantity SET DEFAULT 1`);
      await c.query(`ALTER TABLE public.order_items ALTER COLUMN quantity SET NOT NULL`);

      await c.query(`UPDATE public.order_items SET meta = '{}'::jsonb WHERE meta IS NULL`);
      await c.query(`ALTER TABLE public.order_items ALTER COLUMN meta SET NOT NULL`);

      await c.query(`ALTER TABLE public.order_items DROP COLUMN IF EXISTS price`);
      await c.query(`ALTER TABLE public.order_items DROP COLUMN IF EXISTS amount`);
      await c.query(`ALTER TABLE public.order_items DROP COLUMN IF EXISTS total`);
    }
    if (!(await constraintExists(c, "order_items_order_id_fkey"))) {
      try {
        await c.query(`
          ALTER TABLE public.order_items
          ADD CONSTRAINT order_items_order_id_fkey
          FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE
        `);
      } catch {}
    }
    if (!(await indexExists(c, "public", "idx_order_items_orderid"))) {
      await c.query(`CREATE INDEX idx_order_items_orderid ON public.order_items(order_id)`);
    }

    // Order events
    if (!(await tableExists(c, "public.order_events"))) {
      await c.query(`
        CREATE TABLE public.order_events (
          id         bigserial PRIMARY KEY,
          order_id   uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
          status     text NOT NULL,
          note       text,
          created_at timestamptz NOT NULL DEFAULT now()
        )`);
    }
    if (!(await indexExists(c, "public", "idx_order_events_orderid"))) {
      await c.query(`CREATE INDEX idx_order_events_orderid ON public.order_events(order_id)`);
    }

    // Backfill totals
    await c.query(`
      UPDATE public.orders o
      SET total_cents = sub.total
      FROM (
        SELECT order_id, COALESCE(SUM(COALESCE(price_cents,0) * GREATEST(1, COALESCE(quantity,1))),0)::int AS total
        FROM public.order_items
        GROUP BY order_id
      ) sub
      WHERE o.id = sub.order_id
        AND (o.total_cents IS NULL OR o.total_cents = 0)
    `);

    // Catalog (optional)
    if (await tableExists(c, "public.catalog_items")) {
      if (!(await columnExists(c,"public.catalog_items","price_cents"))) {
        await c.query(`ALTER TABLE public.catalog_items ADD COLUMN price_cents integer`);
      }
      await c.query(`
        UPDATE public.catalog_items
        SET price_cents = GREATEST(0, ROUND( (price::numeric) * 100 )::int)
        WHERE (price_cents IS NULL OR price_cents = 0) AND price IS NOT NULL
      `);
      await c.query(`ALTER TABLE public.catalog_items DROP COLUMN IF EXISTS price`);
    }

    await c.query("COMMIT");
    console.log("✔ Migration completed.");
  } catch (e) {
    try { await c.query("ROLLBACK"); } catch {}
    console.error("✖ Migration failed:", e.message);
    process.exit(1);
  } finally {
    c.release();
    await pool.end();
  }
})();

