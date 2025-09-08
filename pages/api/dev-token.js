"use strict";
async function handler(req, res) {
  const envToken = process.env.INKYLINK_DESKTOP_TOKEN;
  const hdr = req.headers["x-desktop-token"];
  res.status(200).json({
    envToken,
    header: hdr,
    equal: String(envToken||"").trim() === String(hdr||"").trim()
  });
}
export default handler;


