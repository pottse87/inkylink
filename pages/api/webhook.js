import handler from "./stripe/webhook";

// Make sure Next uses raw body (Stripe needs this)
export const config = { api: { bodyParser: false } };

// Force Node runtime (not Edge)
export const runtime = "nodejs";

export default handler;
