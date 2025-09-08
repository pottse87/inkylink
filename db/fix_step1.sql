BEGIN;

-- Make sure UUID generator exists (used by code paths)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Ensure ORDERS has all required columns + sane defaults
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS total_cents integer,
  ADD COLUMN IF NOT EXISTS currency    text,
  ADD COLUMN IF NOT EXISTS source      text,
  ADD COLUMN IF NOT EXISTS session_id  text,
  ADD COLUMN IF NOT EXISTS updated_at  timestamptz,
  ADD COLUMN IF NOT EXISTS created_at  timestamptz;

-- Fill nulls (safe even if table is empty)
UPDATE public.orders SET total_cents = 0          WHERE total_cents IS NULL;
UPDATE public.orders SET currency    = 'usd'      WHERE currency    IS NULL;
UPDATE public.orders SET status      = COALESCE(status, 'submitted');
UPDATE public.orders SET updated_at  = NOW()      WHERE updated_at  IS NULL;
UPDATE public.orders SET created_at  = NOW()      WHERE created_at  IS NULL;

-- Locks the shape (now that nulls are gone)
ALTER TABLE public.orders
  ALTER COLUMN total_cents SET NOT NULL,
  ALTER COLUMN currency    SET NOT NULL,
  ALTER COLUMN status      SET NOT NULL,
  ALTER COLUMN updated_at  SET NOT NULL,
  ALTER COLUMN created_at  SET NOT NULL;

-- Nice to have defaults going forward
ALTER TABLE public.orders
  ALTER COLUMN total_cents SET DEFAULT 0,
  ALTER COLUMN currency    SET DEFAULT 'usd',
  ALTER COLUMN status      SET DEFAULT 'submitted',
  ALTER COLUMN updated_at  SET DEFAULT NOW(),
  ALTER COLUMN created_at  SET DEFAULT NOW();

-- Create ORDER_ITEMS if missing
CREATE TABLE IF NOT EXISTS public.order_items (
  order_id    uuid    NOT NULL,
  item_id     text,
  name        text,
  price_cents integer NOT NULL DEFAULT 0,
  quantity    integer NOT NULL DEFAULT 1,
  meta        jsonb   NOT NULL DEFAULT '{}'::jsonb
);

-- Enforce/repair shape if table already existed with different nullability
ALTER TABLE public.order_items
  ALTER COLUMN price_cents SET DEFAULT 0,
  ALTER COLUMN price_cents SET NOT NULL,
  ALTER COLUMN quantity    SET DEFAULT 1,
  ALTER COLUMN quantity    SET NOT NULL,
  ALTER COLUMN meta        SET NOT NULL;

-- Foreign key + index (safe to re-run)
DO db\fix_step1.sql
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='order_items_order_id_fkey') THEN
    ALTER TABLE public.order_items
      ADD CONSTRAINT order_items_order_id_fkey
      FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
  END IF;
END db\fix_step1.sql;
CREATE INDEX IF NOT EXISTS idx_order_items_orderid ON public.order_items(order_id);

-- Create CARTS if missing
CREATE TABLE IF NOT EXISTS public.carts (
  client_id  text PRIMARY KEY,
  items      jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

-- Create ORDER_EVENTS if missing (used by status/processing)
CREATE TABLE IF NOT EXISTS public.order_events (
  id         bigserial PRIMARY KEY,
  order_id   uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status     text NOT NULL,
  note       text,
  created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_order_events_orderid ON public.order_events(order_id);

-- Handy index for polling/status
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

COMMIT;
