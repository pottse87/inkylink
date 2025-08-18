"use strict";
exports.config = { runtime: "nodejs" };

module.exports = function handler(req, res) {
  try {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Content-Type", "application/json; charset=utf-8");

    if (req.method === "HEAD") return res.status(204).end();
    if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

    return res.status(200).json({
      ok: true,
      env: process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown",
      now: new Date().toISOString(),
    });
  } catch (e) {
    console.error("healthz error:", e);
    try { return res.status(500).json({ ok:false, error: String(e?.message || e) }); } catch {}
  }
};
