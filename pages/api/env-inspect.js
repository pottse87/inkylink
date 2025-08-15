export default function handler(req, res) {
  try {
    const u = process.env.DATABASE_URL ? new URL(process.env.DATABASE_URL) : null;
    const pass = u?.password ?? "";
    const maskedUser = u?.username ? u.username.replace(/.(?=.{3})/g, "*") : null;
    const hasTrailingSpace = /\s$/.test(process.env.DATABASE_URL || "");
    res.status(200).json({
      env: process.env.VERCEL_ENV || process.env.NODE_ENV || "development",
      host: u?.hostname || null,
      port: u?.port || null,
      user: maskedUser,              // e.g. *************dlnn
      passwordLength: pass.length,   // number only
      hasTrailingSpace,              // true if URL ends with whitespace
      query: u ? u.search : null     // e.g. ?sslmode=require&pgbouncer=true
    });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}