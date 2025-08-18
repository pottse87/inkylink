"use strict";

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (req.method === "HEAD") {
    res.status(204).end();
    return;
  }
  if (req.method !== "GET") {
    res.status(405).end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  res
    .status(200)
    .end(
      JSON.stringify({
        ok: true,
        env: process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown",
        now: new Date().toISOString(),
      })
    );
};
