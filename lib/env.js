const REQUIRED = [
  "DATABASE_URL",
  "STRIPE_SECRET_KEY",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "NEXT_PUBLIC_SITE_URL"
];

export const VERCEL_ENV = process.env.VERCEL_ENV || process.env.NODE_ENV || "development";

for (const key of REQUIRED) {
  if (!process.env[key]) {
    const msg = `[env] Missing ${key} in ${VERCEL_ENV}`;
    if (VERCEL_ENV === "production") throw new Error(msg);
  }
}

export const ENV = {
  DATABASE_URL: process.env.DATABASE_URL || "",
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || "",
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || "",
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || "",
  VERCEL_ENV,
};