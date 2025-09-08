BEGIN;

-- Ensure orders.id is a PRIMARY KEY (needed for FK)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.orders'::regclass
      AND contype  = 'p'
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_pkey PRIMARY KEY (id);
  END IF;
END
$$ LANGUAGE plpgsql;

-- Create order_items if missing
CREATE TABLE IF NOT EXISTS public.order_items (
  order_id    uuid    NOT NULL,
  item_id     text,
  name        text,
  price_cents integer NOT NULL DEFAULT 0,
  quantity    integer NOT NULL DEFAULT 1,
  meta        jsonb   NOT NULL DEFAULT '{}'::jsonb
);

-- Enforce/repair shape (non-null, defaults, sane values)
ALTER TABLE public.order_items
  ALTER COLUMN price_cents SET DEFAULT 0,
  ALTER COLUMN price_cents SET NOT NULL,
  ALTER COLUMN quantity    SET DEFAULT 1,
  ALTER COLUMN quantity    SET NOT NULL,
  ALTER COLUMN meta        SET NOT NULL;

-- Add FK only if it doesn't exist yet
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'order_items_order_id_fkey'
  ) THEN
    ALTER TABLE public.order_items
      ADD CONSTRAINT order_items_order_id_fkey
      FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
  END IF;
END
$$ LANGUAGE plpgsql;

-- Helpful index for lookups
CREATE INDEX IF NOT EXISTS idx_order_items_orderid ON public.order_items(order_id);

COMMIT;
