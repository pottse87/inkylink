BEGIN;
ALTER TABLE public.catalog_items
  ADD COLUMN IF NOT EXISTS stripe_price_id text,
  ADD CONSTRAINT catalog_items_stripe_price_id_uniq UNIQUE (stripe_price_id);
COMMIT;
