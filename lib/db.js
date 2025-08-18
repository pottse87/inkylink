"use strict";

import pgPkg from "pg";
const { Pool } = pgPkg;

let _pool = null;

export function getPool() {
  if (_pool) return _pool;

  const raw = process.env.DATABASE_URL || "";
  const cs = String(raw).replace(/\r?\n/g, "").trim();
  if (!cs) throw new Error("Missing DATABASE_URL");

  _pool = new Pool({
    connectionString: cs,
    ssl: { rejectUnauthorized: false }, // supabase pooler/self-signed CA
    max: 5,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 8_000,
    keepAlive: true,
  });

  _pool.on("error", (err) => {
    console.error("[pg] idle client error:", err?.message || err);
  });

  return _pool;
}

export async function withClient(fn) {
  const client = await getPool().connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}
