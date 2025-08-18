module.exports = async function handler(req, res) {
  // Always prevent caching of API responses
  res.setHeader("Cache-Control", "no-store");

  if (req.method === "HEAD") {
    res.status(204).end();
    return;
  }
  if (req.method !== "GET") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  res.status(200).json({
    ok: true,
    env: process.env.VERCEL_ENV || process.env.NODE_ENV || "development",
    now: new Date().toISOString(),
  });
};
