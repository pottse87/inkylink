-- Fix pricing schema mismatch
BEGIN;

-- Add price_cents column if it doesn't exist
ALTER TABLE catalog_items ADD COLUMN IF NOT EXISTS price_cents INTEGER;

-- Convert existing price to cents
UPDATE catalog_items 
SET price_cents = (price * 100)::INTEGER 
WHERE price_cents IS NULL;

-- Make price_cents required
ALTER TABLE catalog_items ALTER COLUMN price_cents SET NOT NULL;

-- Drop old price column
ALTER TABLE catalog_items DROP COLUMN IF EXISTS price;

COMMIT;
