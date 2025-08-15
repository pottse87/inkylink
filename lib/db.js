import { Pool } from "pg";
import { ENV, VERCEL_ENV } from "./env";

if (!ENV.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const url = new URL(ENV.DATABASE_URL);
if (VERCEL_ENV === "production" &&
    (url.hostname === "localhost" || url.hostname === "127.0.0.1")) {
  throw new Error("Refusing to use localhost DATABASE_URL in Production.");
}

const g = globalThis;
export const pool =
  g._pgPool ||
  new Pool({
    connectionString: ENV.DATABASE_URL,
    ssl: { rejectUnauthorized: false }, // Supabase needs SSL on Vercel
    max: 10,
    idleTimeoutMillis: 10_000,
  });
if (!g._pgPool) g._pgPool = pool;