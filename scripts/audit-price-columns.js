"use strict";
const { Pool } = require("pg");

(async () => {
  const cs = process.env.DATABASE_URL;
  if (!cs) { console.error("DATABASE_URL not set"); process.exit(1); }
  const pool = new Pool({ connectionString: cs, ssl: (process.env.PGSSLMODE==="disable"||process.env.DB_SSL==="0"||process.env.DB_SSL==="false") ? false : { rejectUnauthorized: false } });
  const tables = ["catalog_items","carts","cart_items","orders","order_items"];
  const schema = "public";
  const out = {};
  const client = await pool.connect();
  try {
    for (const t of tables) {
      const reg = await client.query("select to_regclass($1) as oid", [`${schema}.${t}`]);
      if (!reg.rows[0].oid) { out[t] = { exists:false }; continue; }
      const cols = await client.query(
        `select column_name,data_type,is_nullable
           from information_schema.columns
          where table_schema=$1 and table_name=$2
          order by ordinal_position`,
        [schema, t]
      );
      const hasPrice = cols.rows.some(r => r.column_name === "price");
      const hasCents = cols.rows.some(r => r.column_name === "price_cents");
      const stats = {};
      if (hasPrice) {
        const r = await client.query(`select count(*)::bigint as n from ${schema}.${t} where price is not null`);
        stats.price_not_null = Number(r.rows[0].n);
      }
      if (hasCents) {
        const r = await client.query(`select count(*)::bigint as n from ${schema}.${t} where price_cents is not null`);
        stats.price_cents_not_null = Number(r.rows[0].n);
      }
      out[t] = {
        exists:true,
        columns: cols.rows,
        stats
      };
    }
    console.log(JSON.stringify(out, null, 2));
  } catch (e) {
    console.error(e.message || String(e));
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
})();

