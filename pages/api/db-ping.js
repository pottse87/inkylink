// pages/api/db-ping.js
let _pool;

/** Build (and memoize) a pg Pool with Supabase pooler-friendly SSL */
function getPool() {
  if (_pool) return _pool;
  const { Pool } = require("pg");

  const cs = process.env.DATABASE_URL;
  if (!cs) {
    const err = new Error("Missing DATABASE_URL env");
    err.status = 500;
    throw err;
  }

  _pool = new Pool({
    connectionString: cs,
    // Supabase pooler uses a cert not in Node's default trust store.
    // We still use TLS, just skip strict CA verification.
    ssl: { rejectUnauthorized: false },
    // Reasonable caps to avoid function timeouts on Vercel
    max: 5,
    idleTimeoutMillis: 5_000,
    connectionTimeoutMillis: 5_000,
  });

  return _pool;
}

function msSince(t0) {
  return Math.round(performance.now() - t0);
}

/** Run a promise with a timeout to avoid hanging serverless functions */
async function withTimeout(promise, ms, label) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
  );
  return Promise.race([promise, timeout]);
}

export default async function handler(req, res) {
  const t0 = performance.now();
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const results = {
    ok: false,
    env: process.env.NODE_ENV || "production",
    steps: [],
    summary: {},
    timings_ms: { total: 0 },
  };

  let client;

  try {
    const pool = getPool();

    // Parse a few bits from the URL just for echo (safe to send back)
    const u = new URL(process.env.DATABASE_URL);
    results.summary.db_target = {
      host: u.hostname,
      port: u.port,
      database: u.pathname.replace(/^\//, "") || "postgres",
      ssl: true,
      // mask user for safety
      user_masked:
        u.username.length <= 4
          ? "***"
          : `${"*".repeat(Math.max(0, u.username.length - 4))}${u.username.slice(-4)}`,
    };

    // 1) Connect
    let t = performance.now();
    client = await withTimeout(pool.connect(), 5_000, "pg.connect");
    results.steps.push({ step: "connect", ok: true, ms: msSince(t) });

    // Ensure we’ll never leave a TX open if anything fails
    let inTx = false;

    try {
      // 2) Basic round-trip: SELECT 1
      t = performance.now();
      const one = await withTimeout(client.query("select 1 as ok"), 3_000, "select 1");
      results.steps.push({ step: "select_1", ok: true, ms: msSince(t), rows: one.rows });

      // 3) Server clock & identity
      t = performance.now();
      const meta = await withTimeout(
        client.query(`
          select
            now() at time zone 'utc' as now_utc,
            current_user,
            current_database() as db,
            version()
        `),
        3_000,
        "meta"
      );
      const m = meta.rows[0] || {};
      results.steps.push({ step: "meta", ok: true, ms: msSince(t) });
      results.summary.pg = {
        now_utc: m.now_utc,
        current_user: m.current_user,
        database: m.db,
        version: m.version,
      };

      // 4) Temp table round-trip (no persistent writes)
      t = performance.now();
      await withTimeout(client.query("create temp table if not exists ping_tmp(x int) on commit drop"), 3_000, "temp_create");
      await withTimeout(client.query("insert into ping_tmp(x) values (1)"), 3_000, "temp_insert");
      const read = await withTimeout(client.query("select count(*)::int as n from ping_tmp"), 3_000, "temp_select");
      results.steps.push({
        step: "temp_roundtrip",
        ok: read.rows?.[0]?.n === 1,
        ms: msSince(t),
        count: read.rows?.[0]?.n ?? null,
      });

      // 5) Existence checks for your expected tables
      t = performance.now();
      const exists = await withTimeout(
        client.query(
          `
            select
              exists (select 1 from information_schema.tables where table_schema='public' and table_name='carts')   as has_carts,
              exists (select 1 from information_schema.tables where table_schema='public' and table_name='catalog') as has_catalog
          `
        ),
        3_000,
        "table_exists"
      );
      const e = exists.rows[0] || {};
      results.steps.push({
        step: "table_checks",
        ok: true,
        ms: msSince(t),
        public: { carts: !!e.has_carts, catalog: !!e.has_catalog },
      });
      results.summary.tables = { carts: !!e.has_carts, catalog: !!e.has_catalog };

      // 6) Quick transaction sanity (rollback)
      t = performance.now();
      await withTimeout(client.query("begin"), 2_000, "begin");
      inTx = true;
      await withTimeout(client.query("select 42 as z"), 2_000, "tx_select");
      await withTimeout(client.query("rollback"), 2_000, "rollback");
      inTx = false;
      results.steps.push({ step: "tx_rollback", ok: true, ms: msSince(t) });

      results.ok = true;
    } catch (inner) {
      // Attempt to rollback if we were in a transaction
      try {
        await client.query("rollback");
      } catch {}
      throw inner;
    } finally {
      client.release();
      client = null;
    }

    results.timings_ms.total = msSince(t0);
    return res.status(200).json(results);
  } catch (err) {
    // Normalize pg-ish errors for easier debugging
    const safe = {
      ok: false,
      error: String(err?.message || err),
      code: err?.code || null,
      detail: err?.detail || null,
      hint: err?.hint || null,
      routine: err?.routine || null,
      where: "api/db-ping",
      env: process.env.NODE_ENV || "production",
      summary: (results && results.summary) || {},
      steps: results?.steps || [],
      timings_ms: { total: msSince(t0) },
    };
    return res.status(err?.status || 500).json(safe);
  } finally {
    // no-op
  }
}
