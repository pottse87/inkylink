BEGIN;
-- clear first (avoids any transient UNIQUE collisions)
UPDATE public.catalog_items
  SET stripe_price_id = NULL
  WHERE id IN ('ongoing-optimization','conversion-booster-pro');

-- set the correct IDs you just gave me
UPDATE public.catalog_items
  SET stripe_price_id = 'price_1RrB9jFjDGmKohCH0yklX14H'
  WHERE id = 'ongoing-optimization';

UPDATE public.catalog_items
  SET stripe_price_id = 'price_1RrBBNFjDGmKohCHE209rvTT'
  WHERE id = 'conversion-booster-pro';
COMMIT;
