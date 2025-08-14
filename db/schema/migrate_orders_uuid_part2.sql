BEGIN;

-- Safety: ensure pgcrypto exists (for gen_random_uuid if we need it)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- If id_uuid is missing (in case of partial runs), add + backfill it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'id_uuid'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN id_uuid uuid;
    UPDATE public.orders
    SET id_uuid = CASE
      WHEN id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
        THEN id::uuid
      ELSE gen_random_uuid()
    END;
  END IF;
END$$;

ALTER TABLE public.orders ALTER COLUMN id_uuid SET NOT NULL;

-- Swap primary key to the uuid column
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_pkey;
ALTER TABLE public.orders ADD CONSTRAINT orders_pkey PRIMARY KEY (id_uuid);

-- Replace old id column with the uuid one
ALTER TABLE public.orders DROP COLUMN IF EXISTS id;
ALTER TABLE public.orders RENAME COLUMN id_uuid TO id;

-- Recreate child tables (uuid-based) if they don't exist
CREATE TABLE IF NOT EXISTS public.order_items (
  id           bigserial PRIMARY KEY,
  order_id     uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  item_id      text NOT NULL,
  name         text,
  description  text,
  price_cents  integer NOT NULL CHECK (price_cents >= 0),
  quantity     integer NOT NULL CHECK (quantity > 0),
  meta         jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.order_events (
  id          bigserial PRIMARY KEY,
  order_id    uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  event_type  text NOT NULL,
  payload     jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order_id  ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_events_order_id ON public.order_events(order_id);

COMMIT;
