BEGIN;

-- Create carts table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.carts (
  client_id  text PRIMARY KEY,
  items      jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- If table already existed, make sure required columns are present
ALTER TABLE public.carts
  ADD COLUMN IF NOT EXISTS items jsonb NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.carts
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Helpful index for reads
CREATE INDEX IF NOT EXISTS idx_carts_updated_at ON public.carts(updated_at);

-- Auto-update the timestamp on UPDATEs
CREATE OR REPLACE FUNCTION public.carts_set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_carts_updated_at ON public.carts;
CREATE TRIGGER trg_carts_updated_at
BEFORE UPDATE ON public.carts
FOR EACH ROW
EXECUTE FUNCTION public.carts_set_updated_at();

COMMIT;
