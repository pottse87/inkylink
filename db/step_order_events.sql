BEGIN;

CREATE TABLE IF NOT EXISTS public.order_events (
  id         bigserial PRIMARY KEY,
  order_id   uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status     text NOT NULL,
  note       text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_events_orderid ON public.order_events(order_id);

COMMIT;
