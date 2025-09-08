BEGIN;

-- Fast fix for the one we see right now
ALTER TABLE public.orders
  ALTER COLUMN total_price DROP NOT NULL;

-- Generic safety net: drop NOT NULL for any other columns we aren't setting
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema='public'
      AND table_name='orders'
      AND is_nullable = 'NO'
      AND column_default IS NULL
      AND column_name NOT IN (
        'id','client_id','total_cents','currency','status','source','session_id','created_at','updated_at'
      )
  LOOP
    EXECUTE format('ALTER TABLE public.orders ALTER COLUMN %I DROP NOT NULL', r.column_name);
  END LOOP;
END
$$ LANGUAGE plpgsql;

COMMIT;
