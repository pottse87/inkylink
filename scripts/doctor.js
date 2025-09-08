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

function redact(url) {
  try {
    const u = new URL(url);
    if (u.password) {
      const mask = "*".repeat(Math.min(8, u.password.length));
      u.password = mask;
    }
    return u.toString();
  } catch { return "(unparseable)"; }
}

(async () => {
  const DB_URL = resolveDbUrl();
  const out = { env: {}, db: {}, tables: {}, columns: {}, counts: {}, errors: [] };

  out.env.node = process.version;
  out.env.cwd = process.cwd();
  out.env.has_DATABASE_URL = !!DB_URL;
  out.env.database_url_redacted = DB_URL ? redact(DB_URL) : null;

  if (!DB_URL) {
    console.log(JSON.stringify(out, null, 2));
    process.exit(0);
  }

  const pool = new (require("pg").Pool)({
    connectionString: DB_URL,
    ssl: (process.env.PGSSLMODE==="disable"||process.env.DB_SSL==="0"||process.env.DB_SSL==="false") ? false : { rejectUnauthorized: false }
  });

  let c;
  try {
    c = await pool.connect();

    // Basic server info
    const info = await c.query("select current_database() db, current_user usr, inet_server_addr() addr, inet_server_port() port, version(), now()");
    out.db = info.rows[0];

    // Helper fns
    const q = async (sql, params=[]) => (await c.query(sql, params)).rows;
    const exists = async (t) => !!(await q("select to_regclass($1) reg",[t.includes(".")?t:`public.${t}`]))[0].reg;
    const col = async (t, colName) => {
      const [sch, name] = t.includes(".") ? t.split(".") : ["public", t];
      return (await q(
        `select 1 from information_schema.columns where table_schema=$1 and table_name=$2 and column_name=$3`,
        [sch,name,colName]
      )).length>0;
    };

    // Tables we care about
    const tableList = ["orders","order_items","carts","catalog_items","order_events"];
    for (const t of tableList) {
      out.tables[t] = await exists(t);
    }

    // Columns we rely on
    const cols = {
      "orders": ["id","client_id","total_cents","currency","status","source","session_id","created_at","updated_at"],
      "order_items": ["order_id","item_id","name","price_cents","quantity","meta"],
      "carts": ["client_id","items","updated_at"],
      "order_events": ["id","order_id","status","note","created_at"],
      "catalog_items": ["id","name","price_cents"]  // catalog is optional; we only check price_cents presence
    };
    for (const [t, list] of Object.entries(cols)) {
      out.columns[t] = {};
      if (out.tables[t]) {
        for (const cName of list) out.columns[t][cName] = await col(t, cName);
      } else {
        for (const cName of list) out.columns[t][cName] = false;
      }
    }

    // Simple counts (read-only)
    if (out.tables.orders)       out.counts.orders       = (await q(`select count(*)::int as total from public.orders`))[0];
    if (out.tables.order_items)  out.counts.order_items  = (await q(`select count(*)::int as total from public.order_items`))[0];
    if (out.tables.carts)        out.counts.carts        = (await q(`select count(*)::int as total from public.carts`))[0];
    if (out.tables.catalog_items)out.counts.catalog_items= (await q(`select count(*)::int as total from public.catalog_items`))[0];
    if (out.tables.order_events) out.counts.order_events = (await q(`select count(*)::int as total from public.order_events`))[0];

  } catch (e) {
    out.errors.push(e.message || String(e));
  } finally {
    if (c) c.release();
    try { await pool.end(); } catch {}
  }

  console.log(JSON.stringify(out, null, 2));
})();

