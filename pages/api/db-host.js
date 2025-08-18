// pages/api/db-host.js
function parseDbUrl(u) {
  try {
    const url = new URL(u);
    const userMasked = (url.username || "").replace(/./g, "*");
    return {
      host: url.hostname,
      port: url.port || null,
      database: url.pathname.replace(/^\//, "") || null,
      ssl: true,
      user_masked: userMasked,
    };
  } catch {
    return null;
  }
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (req.method === "HEAD") {
    res.status(204).end();
    return;
  }
  if (req.method !== "GET") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  const target = parseDbUrl(process.env.DATABASE_URL);
  res.status(200).json({ ok: !!target, target });
};




