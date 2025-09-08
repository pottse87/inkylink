BEGIN;

-- 1) Backfill order_items.price_cents from catalog_items where missing/invalid
UPDATE public.order_items oi
SET price_cents = ci.price_cents
FROM public.catalog_items ci
WHERE oi.item_id = ci.id
  AND (oi.price_cents IS NULL OR oi.price_cents < 0);

-- 2) Any still-null -> 0 (explicit)
UPDATE public.order_items
SET price_cents = 0
WHERE price_cents IS NULL;

-- 3) Enforce NOT NULL, DEFAULT 0, and non-negative constraint (idempotent)
ALTER TABLE public.order_items
  ALTER COLUMN price_cents SET DEFAULT 0,
  ALTER COLUMN price_cents SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname='order_items_price_cents_chk'
      AND conrelid='public.order_items'::regclass
  ) THEN
    ALTER TABLE public.order_items
      ADD CONSTRAINT order_items_price_cents_chk CHECK (price_cents >= 0);
  END IF;
END
$$;

-- 4) Drop legacy decimal total on orders (idempotent)
ALTER TABLE public.orders
  DROP COLUMN IF EXISTS total_price;

-- 5) Helpful index for joins/lookups
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

COMMIT;
