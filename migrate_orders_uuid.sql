BEGIN;

-- Use pgcrypto for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Add a new uuid column to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS id_uuid uuid;

-- 2) Fill it: cast if existing id looks like a UUID, else generate one
WITH src AS (
  SELECT id::text AS old_id,
         CASE
           WHEN id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
             THEN id::uuid
           ELSE gen_random_uuid()
         END AS new_id
  FROM public.orders
)
UPDATE public.orders o
SET id_uuid = s.new_id
FROM src s
WHERE o.id::text = s.old_id;

ALTER TABLE public.orders ALTER COLUMN id_uuid SET NOT NULL;

-- 3) Prepare child tables: drop old FKs if present
ALTER TABLE public.order_items  DROP CONSTRAINT IF EXISTS order_items_order_id_fkey;
ALTER TABLE public.order_events DROP CONSTRAINT IF EXISTS order_events_order_id_fkey;

-- 4) Add a uuid shadow column in children
ALTER TABLE public.order_items  ADD COLUMN IF NOT EXISTS order_id_uuid uuid;
ALTER TABLE public.order_events ADD COLUMN IF NOT EXISTS order_id_uuid uuid;

-- 5) Populate child uuid columns using the mapping
UPDATE public.order_items oi
SET order_id_uuid = o.id_uuid
FROM public.orders o
WHERE oi.order_id::text = o.id::text;

UPDATE public.order_events oe
SET order_id_uuid = o.id_uuid
FROM public.orders o
WHERE oe.order_id::text = o.id::text;

-- 6) Swap columns in children
ALTER TABLE public.order_items  DROP COLUMN order_id;
ALTER TABLE public.order_items  RENAME COLUMN order_id_uuid TO order_id;

ALTER TABLE public.order_events DROP COLUMN order_id;
ALTER TABLE public.order_events RENAME COLUMN order_id_uuid TO order_id;

-- 7) Switch PK in orders to the uuid column
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_pkey;
ALTER TABLE public.orders ADD CONSTRAINT orders_pkey PRIMARY KEY (id_uuid);
ALTER TABLE public.orders DROP COLUMN id;
ALTER TABLE public.orders RENAME COLUMN id_uuid TO id;

-- 8) Recreate FKs with proper types
ALTER TABLE public.order_items
  ADD CONSTRAINT order_items_order_id_fkey
  FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;

ALTER TABLE public.order_events
  ADD CONSTRAINT order_events_order_id_fkey
  FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;

COMMIT;
