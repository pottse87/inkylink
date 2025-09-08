BEGIN;

CREATE TABLE IF NOT EXISTS public.carts (
  client_id  text PRIMARY KEY,
  items      jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

COMMIT;
