BEGIN;

-- 1) Ensure updated_at exists; backfill & default
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.orders
      ADD COLUMN updated_at timestamptz NOT NULL DEFAULT NOW();
  END IF;
END
$$;

UPDATE public.orders SET updated_at = NOW() WHERE updated_at IS NULL;

-- 2) Ensure created_at has sane default
ALTER TABLE public.orders
  ALTER COLUMN created_at SET DEFAULT NOW();

-- 3) Currency: backfill, default, and enforce NOT NULL
UPDATE public.orders SET currency = 'usd' WHERE currency IS NULL OR currency = '';
ALTER TABLE public.orders
  ALTER COLUMN currency SET DEFAULT 'usd',
  ALTER COLUMN currency SET NOT NULL;

-- 4) Status: backfill NULLs and constrain allowed values + default
UPDATE public.orders SET status = 'submitted' WHERE status IS NULL OR status = '';
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname='orders_status_chk' AND conrelid='public.orders'::regclass
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_status_chk CHECK (
        status IN ('submitted','processing','completed','canceled','failed','paid','error')
      );
  END IF;
END
$$;
ALTER TABLE public.orders
  ALTER COLUMN status SET DEFAULT 'submitted',
  ALTER COLUMN status SET NOT NULL;

-- 5) Maintain updated_at automatically
CREATE OR REPLACE FUNCTION public.set_orders_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $fn$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END
$fn$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_orders_set_updated_at'
      AND tgrelid = 'public.orders'::regclass
  ) THEN
    CREATE TRIGGER trg_orders_set_updated_at
    BEFORE UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.set_orders_updated_at();
  END IF;
END
$$;

-- 6) Primary key safety
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid='public.orders'::regclass AND contype='p'
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_pkey PRIMARY KEY (id);
  END IF;
END
$$;

-- 7) Fast claim query: status + created_at + id
CREATE INDEX IF NOT EXISTS idx_orders_status_created_at_id
  ON public.orders (status, created_at, id);

COMMIT;
