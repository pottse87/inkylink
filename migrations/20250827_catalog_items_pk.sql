BEGIN;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.catalog_items'::regclass
      AND contype = 'p'
  ) THEN
    ALTER TABLE public.catalog_items
      ADD CONSTRAINT catalog_items_pkey PRIMARY KEY (id);
  END IF;
END
$$;
COMMIT;
