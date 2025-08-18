export default function handler(req, res) {
  try {
    const urlStr = process.env.DATABASE_URL || "";
    const hostFromUrl = urlStr ? new URL(urlStr).hostname : null;
    const envHost = process.env.PGHOST || null;
    res.status(200).json({
      hostFromUrl,          // e.g. my-db.neon.tech (or "localhost" if misconfigured)
      envHost,              // if you use split PG vars
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      nodeEnv: process.env.NODE_ENV || null,
      now: new Date().toISOString()
    });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}
