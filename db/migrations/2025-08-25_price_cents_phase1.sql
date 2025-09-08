BEGIN;

-- 1) catalog_items: add price_cents, backfill from price, clamp non-negative
ALTER TABLE IF EXISTS public.catalog_items
  ADD COLUMN IF NOT EXISTS price_cents integer;

UPDATE public.catalog_items
SET price_cents = GREATEST(0, ROUND( (price::numeric) * 100 )::int)
WHERE (price_cents IS NULL OR price_cents = 0)
  AND price IS NOT NULL;

-- If everything has price_cents now, make it NOT NULL (safe, conditional)
DO 2025-08-25_price_cents_phase1.sql
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'catalog_items' AND column_name = 'price_cents'
  ) AND NOT EXISTS (
    SELECT 1 FROM public.catalog_items WHERE price_cents IS NULL
  ) THEN
    ALTER TABLE public.catalog_items ALTER COLUMN price_cents SET NOT NULL;
  END IF;
END 2025-08-25_price_cents_phase1.sql;

-- 2) order_items: ensure price_cents is int and non-null/non-negative
ALTER TABLE IF EXISTS public.order_items
  ALTER COLUMN price_cents TYPE integer USING COALESCE(ROUND(price_cents)::int, 0),
  ALTER COLUMN price_cents SET NOT NULL;

UPDATE public.order_items
SET price_cents = GREATEST(0, price_cents)
WHERE price_cents < 0;

-- 3) orders: ensure total_cents is int + non-null
ALTER TABLE IF EXISTS public.orders
  ALTER COLUMN total_cents TYPE integer USING COALESCE(ROUND(total_cents)::int, 0),
  ALTER COLUMN total_cents SET NOT NULL;

-- 4) carts: normalize JSON items to have price_cents (from existing price_cents or from price * 100)
--    Also strip any legacy "price" field so downstream never sees decimal.
UPDATE public.carts
SET items = (
  SELECT jsonb_agg(
    (elem - 'price')  -- remove decimal price if present
    || jsonb_build_object(
         'price_cents',
         GREATEST(
           0,
           COALESCE(
             NULLIF(elem->>'price_cents','')::int,
             CASE
               WHEN (elem ? 'price') AND (elem->>'price') ~ '^[0-9]+(\.[0-9]+)?$'
               THEN ROUND( ((elem->>'price')::numeric) * 100 )::int
               ELSE 0
             END
           )
         )
       )
  )
  FROM jsonb_array_elements(items) AS elem
)
WHERE items IS NOT NULL
  AND jsonb_typeof(items) = 'array';

COMMIT;
