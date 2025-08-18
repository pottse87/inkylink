export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({
    ok: true,
    route: "/api/echo",
    method: req.method,
    now: new Date().toISOString(),
  });
}


