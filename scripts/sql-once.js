#!/usr/bin/env node
"use strict";
const fs = require("fs");
const { Pool } = require("pg");

const file = process.argv[2];
if (!file) { console.error("Usage: node scripts/sql-once.js <sql-file>"); process.exit(1); }
if (!fs.existsSync(file)) { console.error("No such file:", file); process.exit(1); }

const sql = fs.readFileSync(file, "utf8");
console.log("Executing SQL from", file, "(", sql.length, "bytes )");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: (process.env.PGSSLMODE==="disable"||process.env.DB_SSL==="0"||process.env.DB_SSL==="false") ? false : { rejectUnauthorized: false }
});

(async () => {
  const c = await pool.connect();
  try {
    await c.query(sql);
    console.log("OK:", file);
  } catch (e) {
    console.error("ERROR:", e.message || e);
    if (e.position) {
      const pos = Number(e.position);
      const before = sql.slice(Math.max(0, pos - 120), pos);
      const after  = sql.slice(pos, pos + 120);
      const line = sql.slice(0, pos).split(/\r?\n/).length;
      console.error(`At char ${pos} (line ${line}):`);
      console.error("…" + before.replace(/\r?\n/g,"⏎") + "⟂" + after.replace(/\r?\n/g,"⏎") + "…");
    }
    process.exit(1);
  } finally {
    c.release();
    await pool.end();
  }
})();

