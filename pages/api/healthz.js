// pages/api/healthz.js — zero-dependency liveness

function setHeaders(res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("X-Content-Type-Options", "nosniff");
}

module.exports = function handler(req, res) {
  setHeaders(res);

  if (req.method === "HEAD") {
    res.status(204).end();
    return;
  }
  if (req.method !== "GET") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  res.status(200).json({
    ok: true,
    env: process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown",
    now: new Date().toISOString()
  });
};

module.exports.config = { api: { bodyParser: true }, runtime: "nodejs" };
