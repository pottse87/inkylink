-- 1) catalog_items: ensure price_cents exists and is filled from decimal price if needed
ALTER TABLE IF EXISTS public.catalog_items
  ADD COLUMN IF NOT EXISTS price_cents integer;

UPDATE public.catalog_items
SET price_cents = GREATEST(0, ROUND( (price::numeric) * 100 )::int)
WHERE (price_cents IS NULL OR price_cents = 0)
  AND price IS NOT NULL;

-- 2) order_items: ensure column exists (no-op if already present), and clamp non-negative
ALTER TABLE IF EXISTS public.order_items
  ADD COLUMN IF NOT EXISTS price_cents integer;

UPDATE public.order_items
SET price_cents = GREATEST(0, COALESCE(price_cents,0));

-- 3) orders: add total_cents if missing
ALTER TABLE IF EXISTS public.orders
  ADD COLUMN IF NOT EXISTS total_cents integer;

-- Fill orders.total_cents from order_items if null/zero
UPDATE public.orders o
SET total_cents = sub.total
FROM (
  SELECT order_id, COALESCE(SUM(COALESCE(price_cents,0) * GREATEST(1, COALESCE(quantity,1))),0)::int AS total
  FROM public.order_items
  GROUP BY order_id
) sub
WHERE o.id = sub.order_id
  AND (o.total_cents IS NULL OR o.total_cents = 0);

-- 4) carts: normalize JSON items to have price_cents, remove any decimal 'price' fields
UPDATE public.carts
SET items = (
  SELECT jsonb_agg(
    (elem - 'price')
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
