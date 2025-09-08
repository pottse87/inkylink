BEGIN;

-- 1) Add column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema='public'
      AND table_name='order_events'
      AND column_name='status'
  ) THEN
    ALTER TABLE public.order_events
      ADD COLUMN status TEXT;
  END IF;
END
$$;

-- 2) Backfill any NULLs
UPDATE public.order_events
   SET status = 'unknown'
 WHERE status IS NULL;

-- 3) Add CHECK constraint if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'order_events_status_chk'
      AND conrelid = 'public.order_events'::regclass
  ) THEN
    ALTER TABLE public.order_events
      ADD CONSTRAINT order_events_status_chk
      CHECK (status IN ('queued','processing','paid','submitted','completed','canceled','failed','error','unknown'));
  END IF;
END
$$;

-- 4) Enforce NOT NULL
ALTER TABLE public.order_events
  ALTER COLUMN status SET NOT NULL;

-- 5) Helpful index
CREATE INDEX IF NOT EXISTS idx_order_events_order_id
  ON public.order_events(order_id);

COMMIT;
