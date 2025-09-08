BEGIN;

-- Create sequence if missing and initialize to MAX(id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class WHERE relkind = 'S' AND relname = 'order_items_id_seq'
  ) THEN
    CREATE SEQUENCE public.order_items_id_seq;
    PERFORM setval('public.order_items_id_seq',
                   COALESCE((SELECT MAX(id) FROM public.order_items), 0));
  END IF;
END
$$;

-- Ensure the sequence is owned by the column (clean drops)
ALTER SEQUENCE public.order_items_id_seq OWNED BY public.order_items.id;

-- Ensure id uses the sequence by default
ALTER TABLE public.order_items
  ALTER COLUMN id SET DEFAULT nextval('public.order_items_id_seq');

-- Ensure primary key exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.order_items'::regclass AND contype = 'p'
  ) THEN
    ALTER TABLE public.order_items
      ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);
  END IF;
END
$$;

COMMIT;
