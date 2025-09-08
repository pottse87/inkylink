BEGIN;

-- 1) Ensure sane quantity: NULL -> 1, non-negative constraint, default 1
UPDATE public.order_items SET quantity = 1 WHERE quantity IS NULL;

ALTER TABLE public.order_items
  ALTER COLUMN quantity SET DEFAULT 1;

ALTER TABLE public.order_items
  ALTER COLUMN quantity SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname='order_items_quantity_chk'
      AND conrelid='public.order_items'::regclass
  ) THEN
    ALTER TABLE public.order_items
      ADD CONSTRAINT order_items_quantity_chk CHECK (quantity >= 1);
  END IF;
END
$$;

-- 2) Function to recompute order totals in cents
CREATE OR REPLACE FUNCTION public.recalc_order_total(p_order_id uuid)
RETURNS void
LANGUAGE sql
AS $$
  UPDATE public.orders o
     SET total_cents = COALESCE((
       SELECT SUM(COALESCE(oi.price_cents,0)::bigint * COALESCE(oi.quantity,1)::bigint)
       FROM public.order_items oi
       WHERE oi.order_id = p_order_id
     ),0)
   WHERE o.id = p_order_id;
$$;

-- 3) Trigger function to call recompute after item changes
CREATE OR REPLACE FUNCTION public.recalc_order_total_trigger()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  PERFORM public.recalc_order_total(
    CASE WHEN TG_OP = 'DELETE' THEN OLD.order_id ELSE NEW.order_id END
  );
  RETURN NULL;
END;
$$;

-- 4) Create trigger once (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_order_items_total_aiud'
      AND tgrelid = 'public.order_items'::regclass
  ) THEN
    CREATE TRIGGER trg_order_items_total_aiud
    AFTER INSERT OR UPDATE OF price_cents, quantity OR DELETE
    ON public.order_items
    FOR EACH ROW
    EXECUTE FUNCTION public.recalc_order_total_trigger();
  END IF;
END
$$;

-- 5) One-time backfill totals for all existing orders
WITH ids AS (
  SELECT id FROM public.orders
)
SELECT public.recalc_order_total(ids.id) FROM ids;

-- 6) Defensive constraint on orders.total_cents (non-negative)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname='orders_total_cents_chk'
      AND conrelid='public.orders'::regclass
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_total_cents_chk CHECK (total_cents >= 0);
  END IF;
END
$$;

COMMIT;
