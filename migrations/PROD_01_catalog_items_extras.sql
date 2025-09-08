BEGIN;

-- columns
ALTER TABLE public.catalog_items
  ADD COLUMN IF NOT EXISTS includes jsonb,
  ADD COLUMN IF NOT EXISTS color text,
  ADD COLUMN IF NOT EXISTS stripe_price_id text;

-- unique on stripe_price_id (NULLs allowed)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname='public' AND tablename='catalog_items'
      AND indexname='idx_catalog_items_stripe_price_unique'
  ) THEN
    CREATE UNIQUE INDEX idx_catalog_items_stripe_price_unique
      ON public.catalog_items(stripe_price_id)
      WHERE stripe_price_id IS NOT NULL;
  END IF;
END
$$;

COMMIT;
