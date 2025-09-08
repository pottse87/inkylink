BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS total_cents integer,
  ADD COLUMN IF NOT EXISTS currency    text,
  ADD COLUMN IF NOT EXISTS source      text,
  ADD COLUMN IF NOT EXISTS session_id  text,
  ADD COLUMN IF NOT EXISTS updated_at  timestamptz,
  ADD COLUMN IF NOT EXISTS created_at  timestamptz;

UPDATE public.orders SET total_cents = 0          WHERE total_cents IS NULL;
UPDATE public.orders SET currency    = 'usd'      WHERE currency    IS NULL;
UPDATE public.orders SET status      = COALESCE(status, 'submitted');
UPDATE public.orders SET updated_at  = NOW()      WHERE updated_at  IS NULL;
UPDATE public.orders SET created_at  = NOW()      WHERE created_at  IS NULL;

ALTER TABLE public.orders
  ALTER COLUMN total_cents SET NOT NULL,
  ALTER COLUMN currency    SET NOT NULL,
  ALTER COLUMN status      SET NOT NULL,
  ALTER COLUMN updated_at  SET NOT NULL,
  ALTER COLUMN created_at  SET NOT NULL;

ALTER TABLE public.orders
  ALTER COLUMN total_cents SET DEFAULT 0,
  ALTER COLUMN currency    SET DEFAULT 'usd',
  ALTER COLUMN status      SET DEFAULT 'submitted',
  ALTER COLUMN updated_at  SET DEFAULT NOW(),
  ALTER COLUMN created_at  SET DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

COMMIT;
