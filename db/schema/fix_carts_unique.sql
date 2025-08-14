BEGIN;

-- Make sure items has a default array
ALTER TABLE public.carts
  ALTER COLUMN items SET DEFAULT ''[]''::jsonb;

-- Remove duplicate client_id rows (keep the most recent by updated_at/created_at)
WITH ranked AS (
  SELECT ctid,
         ROW_NUMBER() OVER (
           PARTITION BY client_id
           ORDER BY updated_at DESC NULLS LAST,
                    created_at DESC NULLS LAST,
                    ctid DESC
         ) AS rn
  FROM public.carts
)
DELETE FROM public.carts c
USING ranked r
WHERE c.ctid = r.ctid
  AND r.rn > 1;

-- Add UNIQUE(client_id) if it isn't there yet
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = ''carts_client_id_key''
      AND conrelid = ''public.carts''::regclass
  ) THEN
    ALTER TABLE public.carts
      ADD CONSTRAINT carts_client_id_key UNIQUE (client_id);
  END IF;
END$$;

-- Ensure updated_at auto-updates on change (function + trigger)
CREATE OR REPLACE FUNCTION public.carts_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $func$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END
$func$;

DROP TRIGGER IF EXISTS trg_carts_updated_at ON public.carts;
CREATE TRIGGER trg_carts_updated_at
BEFORE UPDATE ON public.carts
FOR EACH ROW
EXECUTE FUNCTION public.carts_set_updated_at();

COMMIT;
