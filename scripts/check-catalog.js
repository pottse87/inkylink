#!/usr/bin/env node
// scripts/check-catalog.js
const fs = require("fs");
const path = require("path");

const file = path.join(process.cwd(), "catalog.json");
if (!fs.existsSync(file)) {
  console.error("ERROR: catalog.json not found at project root:", file);
  process.exit(1);
}

let raw;
try {
  raw = JSON.parse(fs.readFileSync(file, "utf8"));
} catch (e) {
  console.error("ERROR: catalog.json is not valid JSON:", e.message);
  process.exit(1);
}

function pickArray(obj, keys) {
  if (!obj || typeof obj !== "object") return null;
  for (const k of keys) {
    const v = obj[k];
    if (Array.isArray(v)) return v;
  }
  return null;
}

let products = [];
let plans = [];

if (Array.isArray(raw)) {
  // Catalog is a single array of products
  products = raw;
} else if (raw && typeof raw === "object") {
  // Common shapes: { oneTimeProducts: [...], plans: [...] } OR { products: [...] }
  products = pickArray(raw, ["oneTimeProducts", "products", "items", "services"]) || [];
  plans    = pickArray(raw, ["plans", "subscriptions"]) || [];
}

let errors = 0, warnings = 0;
const err  = (m) => { errors++; console.error("ERROR:", m); };
const warn = (m) => { warnings++; console.warn("WARN:", m); };

const seenProd = new Set();
products.forEach((p, i) => {
  if (!p || typeof p !== "object") { err(`products[${i}] is not an object`); return; }
  const id = String(p.id ?? "").trim();
  if (!id) err(`products[${i}] missing id`);
  else if (seenProd.has(id)) err(`Duplicate product id: ${id}`);
  else seenProd.add(id);

  const price = Number(p.price);
  if (!Number.isFinite(price) || price < 0) err(`Bad price for ${id || `(idx:${i})`}: ${p.price}`);

  if (!p.title && !p.name) warn(`Product ${id || `(idx:${i})`} missing title/name`);
  if (!p.stripeMonthlyId || !String(p.stripeMonthlyId).trim()) {
    err(`Product ${id || `(idx:${i})`} missing stripeMonthlyId`);
  }
});

const seenPlan = new Set();
plans.forEach((pl, i) => {
  if (!pl || typeof pl !== "object") { err(`plans[${i}] is not an object`); return; }
  const id = String(pl.id ?? "").trim();
  if (!id) err(`plans[${i}] missing id`);
  else if (seenPlan.has(id)) err(`Duplicate plan id: ${id}`);
  else seenPlan.add(id);

  const pm = Number(pl.priceMonthly);
  const py = Number(pl.priceYearly);
  if (!Number.isFinite(pm) || pm <= 0) err(`Plan ${id || `(idx:${i})`} bad priceMonthly: ${pl.priceMonthly}`);
  if (!Number.isFinite(py) || py <= 0) err(`Plan ${id || `(idx:${i})`} bad priceYearly: ${pl.priceYearly}`);

  if (!pl.stripeMonthlyId || !String(pl.stripeMonthlyId).trim()) err(`Plan ${id || `(idx:${i})`} missing stripeMonthlyId`);
  if (!pl.stripeYearlyId  || !String(pl.stripeYearlyId ).trim()) err(`Plan ${id || `(idx:${i})`} missing stripeYearlyId`);
});

console.log(`Checked ${products.length} product(s) and ${plans.length} plan(s).`);
if (errors > 0) {
  console.error(`FAILED with ${errors} error(s), ${warnings} warning(s).`);
  process.exit(1);
} else {
  console.log(`Catalog OK with ${warnings} warning(s).`);
}
