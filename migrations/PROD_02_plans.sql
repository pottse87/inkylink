BEGIN;

CREATE TABLE IF NOT EXISTS public.plans (
  id                  text PRIMARY KEY,
  name                text NOT NULL,
  description         text,
  icon                text,
  color               text,
  price_monthly_cents integer NOT NULL DEFAULT 0,
  price_yearly_cents  integer NOT NULL DEFAULT 0,
  stripe_monthly_id   text,
  stripe_yearly_id    text,
  product_descriptions integer,
  product_overview     integer,
  bullet_rewrites      integer,
  welcome_email        integer,
  seo_metadata         integer,
  blog                 text,
  faq                  text,
  revisions            text,
  email                text,
  extra                text
);

-- add any missing columns (idempotent)
ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS description         text,
  ADD COLUMN IF NOT EXISTS icon                text,
  ADD COLUMN IF NOT EXISTS color               text,
  ADD COLUMN IF NOT EXISTS price_monthly_cents integer,
  ADD COLUMN IF NOT EXISTS price_yearly_cents  integer,
  ADD COLUMN IF NOT EXISTS stripe_monthly_id   text,
  ADD COLUMN IF NOT EXISTS stripe_yearly_id    text,
  ADD COLUMN IF NOT EXISTS product_descriptions integer,
  ADD COLUMN IF NOT EXISTS product_overview     integer,
  ADD COLUMN IF NOT EXISTS bullet_rewrites      integer,
  ADD COLUMN IF NOT EXISTS welcome_email        integer,
  ADD COLUMN IF NOT EXISTS seo_metadata         integer,
  ADD COLUMN IF NOT EXISTS blog                 text,
  ADD COLUMN IF NOT EXISTS faq                  text,
  ADD COLUMN IF NOT EXISTS revisions            text,
  ADD COLUMN IF NOT EXISTS email                text,
  ADD COLUMN IF NOT EXISTS extra                text;

-- unique indexes for Stripe plan prices (nullable)
CREATE UNIQUE INDEX IF NOT EXISTS idx_plans_stripe_monthly_unique
  ON public.plans(stripe_monthly_id) WHERE stripe_monthly_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_plans_stripe_yearly_unique
  ON public.plans(stripe_yearly_id) WHERE stripe_yearly_id IS NOT NULL;

COMMIT;
