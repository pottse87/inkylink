const { Client } = require("pg");

async function main() {
  const cs = process.env.DATABASE_URL;
  if (!cs) throw new Error("Missing DATABASE_URL env");
  const client = new Client({ connectionString: cs, ssl: (process.env.PGSSLMODE==="disable"||process.env.DB_SSL==="0"||process.env.DB_SSL==="false") ? false : { rejectUnauthorized: false } });
  await client.connect();

  const ddl = `
  create table if not exists public.carts (
    client_id   text primary key,
    items       jsonb not null default '[]'::jsonb,
    updated_at  timestamptz not null default now()
  );

  create table if not exists public.catalog (
    id           text primary key,
    name         text not null,
    price_cents  integer not null check (price_cents >= 0)
  );
  `;

  await client.query("BEGIN");
  await client.query(ddl);
  await client.query("COMMIT");
  await client.end();
  console.log("✅ DB tables ensured (carts, catalog).");
}

main().catch(async (err) => {
  console.error("❌ Provision failed:", err.message || err);
  process.exit(1);
});

