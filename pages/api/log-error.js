/**
 * pages/api/log-error.js
 * POST { event, message, detail } – best-effort client->server log.
 * Never throws to the client; rate-limit can be added at the CDN/WAF layer.
 */
const isProd = process.env.NODE_ENV === "production";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Robots-Tag", "noindex");

  try {
    const body = (req.body && typeof req.body === "object") ? req.body : {};
    const event = String(body.event || "client_error").slice(0, 64);
    const message = String(body.message || "").slice(0, 500);
    const detail = body.detail ?? null;

    const payload = { ts: Date.now(), event, message, detail };

    if (isProd) {
      console.warn("[log-error]", JSON.stringify(payload));
    } else {
      console.log("[log-error]", JSON.stringify(payload));
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    // Do not punish the client for logging failures
    return res.status(200).json({ ok: true, degraded: true });
  }
}
