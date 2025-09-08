BEGIN;

-- Ensure optional columns + stripe_price_id exist
ALTER TABLE public.catalog_items
  ADD COLUMN IF NOT EXISTS description     text,
  ADD COLUMN IF NOT EXISTS icon            text,
  ADD COLUMN IF NOT EXISTS color           text,
  ADD COLUMN IF NOT EXISTS includes        jsonb,
  ADD COLUMN IF NOT EXISTS stripe_price_id text;

-- Recreate unique on stripe_price_id (normalized name)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname='catalog_items_stripe_price_id_uniq'
      AND conrelid='public.catalog_items'::regclass
  ) THEN
    ALTER TABLE public.catalog_items DROP CONSTRAINT catalog_items_stripe_price_id_uniq;
  END IF;
END$$;

ALTER TABLE public.catalog_items
  ADD CONSTRAINT catalog_items_stripe_price_id_uniq UNIQUE (stripe_price_id);

-- Normalize ID spelling (no-op if already)
UPDATE public.catalog_items SET id='enhanced-amazon-content'
 WHERE lower(id) IN ('enhanced amazon content');

-- Authoritative Stripe Price IDs (from you)
UPDATE public.catalog_items
   SET stripe_price_id = 'price_1RrB9jFjDGmKohCH0yklX14H'
 WHERE id = 'ongoing-optimization';

UPDATE public.catalog_items
   SET stripe_price_id = 'price_1RrBBNFjDGmKohCHE209rvTT'
 WHERE id = 'conversion-booster-pro';

COMMIT;
