BEGIN;

-- 1) Drop the redundant partial unique index (we’ll keep the UNIQUE constraint)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname='public' AND tablename='orders' AND indexname='idx_orders_stripe_session_id_unique'
  ) THEN
    DROP INDEX public.idx_orders_stripe_session_id_unique;
  END IF;
END
$$;

-- 2) Drop the duplicate total_cents check (keep orders_total_cents_chk)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid='public.orders'::regclass AND conname='orders_total_cents_nonneg'
  ) THEN
    ALTER TABLE public.orders DROP CONSTRAINT orders_total_cents_nonneg;
  END IF;
END
$$;

-- 3) Ensure updated_at is NOT NULL
UPDATE public.orders SET updated_at = NOW() WHERE updated_at IS NULL;
ALTER TABLE public.orders ALTER COLUMN updated_at SET NOT NULL;

COMMIT;
