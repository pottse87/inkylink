"use strict";
const fs = require("fs");
const { Pool } = require("pg");
(async () => {
  const file = process.argv[2];
  if (!file) { console.error("SQL file path required"); process.exit(1); }
  const sql = fs.readFileSync(file, "utf8");
  const cs = process.env.DATABASE_URL;
  if (!cs) { console.error("DATABASE_URL is not set in environment"); process.exit(1); }
  const pool = new Pool({ connectionString: cs, ssl: (process.env.PGSSLMODE==="disable"||process.env.DB_SSL==="0"||process.env.DB_SSL==="false") ? false : { rejectUnauthorized: false } });
  const client = await pool.connect();
  try {
    await client.query(sql);
    console.log("OK");
  } finally {
    client.release();
    await pool.end();
  }
})().catch(e => { console.error(e.message || String(e)); process.exit(1); });

