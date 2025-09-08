import { getPool } from '../../../lib/db.mjs';


export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const isProd   = process.env.NODE_ENV === "production";
  const expect   = process.env.INKYLINK_DESKTOP_TOKEN || "";
  const allowProd= process.env.FORCE_COMPLETE_IN_PROD === "1"; // default off
  const tokenHdr = req.headers["x-desktop-token"] || "";
  const tokenBody= (req.body && req.body.token) || "";

  // In production: require exact token AND explicit env opt-in
  // In dev: allow token "dev" or the configured token
  const okDev = (!isProd && (tokenHdr === "dev" || tokenBody === "dev" || tokenHdr === expect || tokenBody === expect));
  const okProd = (isProd && allowProd && expect && (tokenHdr === expect || tokenBody === expect));
  if (!(okDev || okProd)) {
    return res.status(isProd ? 403 : 401).json({ error: isProd ? "Forbidden" : "Unauthorized" });
  }

  const cs = process.env.DATABASE_URL;
  if (!cs) return res.status(500).json({ error: "DATABASE_URL not configured" });

  const pool = await getPool();
const db = await pool.connect();

  try {
    const { order_id, note } = req.body || {};
    if (!order_id) return res.status(400).json({ error: "order_id required" });

    const fakeSession = `cs_test_force_${Date.now()}`;

    await db.query("BEGIN");
    await db.query(`
      UPDATE public.orders
         SET status='paid',
             stripe_session_id = COALESCE(stripe_session_id, $2),
             updated_at = NOW()
       WHERE id = $1
    `, [order_id, fakeSession]);

    await db.query(`
      INSERT INTO public.order_events (order_id, event_type, status, note)
      VALUES ($1, 'status_update', 'paid', $2)
    `, [order_id, note || (isProd ? 'force-complete (prod-gated)' : 'force-complete (dev)')]);

    await db.query("COMMIT");
    return res.status(200).json({ ok: true, order_id, stripe_session_id: fakeSession });
  } catch (e) {
    try { await db.query("ROLLBACK"); } catch {}
    console.error("force-complete error:", e?.message || e);
    return res.status(500).json({ error: "Internal Server Error" });
  } finally {
    db.release(); 
  }
}


