BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema='public'
      AND table_name='order_events'
      AND column_name='note'
  ) THEN
    ALTER TABLE public.order_events
      ADD COLUMN note TEXT NOT NULL DEFAULT '';
  END IF;
END
$$;

COMMIT;
