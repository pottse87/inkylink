BEGIN;
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS stripe_session_id text;
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session_id
  ON public.orders (stripe_session_id);
COMMIT;
