BEGIN;

DO $json
DECLARE v_type text;
BEGIN
  SELECT data_type INTO v_type
  FROM information_schema.columns
  WHERE table_schema='public' AND table_name='orders' AND column_name='ai_assistant';

  IF NOT FOUND THEN
    RAISE NOTICE 'orders.ai_assistant not found (nothing to fix).';
  ELSIF v_type = 'boolean' THEN
    ALTER TABLE public.orders ALTER COLUMN ai_assistant SET DEFAULT false;
    UPDATE public.orders SET ai_assistant = false WHERE ai_assistant IS NULL;
  ELSIF v_type IN ('text','character varying') THEN
    ALTER TABLE public.orders ALTER COLUMN ai_assistant SET DEFAULT 'none';
    UPDATE public.orders SET ai_assistant = 'none'
    WHERE ai_assistant IS NULL OR btrim(ai_assistant) = '';
  ELSIF v_type IN ('integer','bigint','smallint','numeric') THEN
    ALTER TABLE public.orders ALTER COLUMN ai_assistant SET DEFAULT 0;
    UPDATE public.orders SET ai_assistant = 0 WHERE ai_assistant IS NULL;
  ELSE
    -- Unknown type: unblock inserts by allowing NULLs
    RAISE NOTICE 'orders.ai_assistant is type %, dropping NOT NULL to unblock inserts.', v_type;
    ALTER TABLE public.orders ALTER COLUMN ai_assistant DROP NOT NULL;
  END IF;
END
$json LANGUAGE plpgsql;

COMMIT;
