// lib/db.js
import { Pool } from "pg";

const globalForPool = globalThis;

const pool =
  globalForPool.pgPool ??
  new Pool({
    connectionString:
      process.env.DATABASE_URL ??
      "postgres://postgres:123Boogerlips!@localhost:5432/inkylink",
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPool.pgPool = pool;
}

const db = {
  query: (text, params) => pool.query(text, params),
};

export { pool };
export default db;
