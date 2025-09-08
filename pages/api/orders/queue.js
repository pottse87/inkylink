"use strict";

async function handler(req, res) {
  res.setHeader("Deprecation", "true");
  res.setHeader("Link", "</api/orders/next>; rel=\"successor-version\"");
  res.status(410).json({ error: "This endpoint is deprecated. Use /api/orders/next." });
}
export default handler;

