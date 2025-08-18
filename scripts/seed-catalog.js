const { Client } = require("pg");
(async () => {
  const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  await client.query(`
    insert into public.catalog (id, name, price_cents)
    values ('sku_1','Test SKU',1000)
    on conflict (id) do nothing;
  `);
  await client.end();
  console.log("✅ Seeded catalog with sku_1.");
})().catch(e => { console.error("❌ Seed failed:", e.message || e); process.exit(1); });
