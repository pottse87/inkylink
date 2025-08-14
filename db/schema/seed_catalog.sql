-- =========================
-- InkyLink seed & schema
-- =========================

-- 1) Core tables

CREATE TABLE IF NOT EXISTS public.catalog_items (
  id          text PRIMARY KEY,
  title       text NOT NULL,
  description text,
  price       numeric(10,2) NOT NULL CHECK (price >= 0),
  icon        text,
  stripe_id   text
);

CREATE TABLE IF NOT EXISTS public.carts (
  client_id  text PRIMARY KEY,
  items      jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.orders (
  id               uuid PRIMARY KEY,
  client_id        text NOT NULL,
  total_cents      integer NOT NULL CHECK (total_cents >= 0),
  currency         text NOT NULL,
  status           text NOT NULL,
  source           text,
  idempotency_key  text UNIQUE,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id           bigserial PRIMARY KEY,
  order_id     uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  item_id      text NOT NULL,
  name         text,
  description  text,
  price_cents  integer NOT NULL CHECK (price_cents >= 0),
  quantity     integer NOT NULL CHECK (quantity > 0),
  meta         jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.order_events (
  id          bigserial PRIMARY KEY,
  order_id    uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  event_type  text NOT NULL,
  payload     jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_carts_updated_at ON public.carts(updated_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_events_order_id ON public.order_events(order_id);

-- 2) Seed / upsert catalog
INSERT INTO public.catalog_items (id, title, description, price, icon, stripe_id) VALUES
('product description','Product Description','Stand out in search with expertly crafted product descriptions.',39.00,'/icons/desc.png',NULL),
('product overview','Product Overview','Highlight your product in a quick, easy-to-read snapshot.',29.00,'/icons/overview.png',NULL),
('welcome email','Welcome Email','Make a lasting first impression with a warm, professional welcome.',39.00,'/icons/welcome.png',NULL),
('product drop email','Product Drop Email','Announce your new product with a sharp branded impact.',39.00,'/icons/drop.png',NULL),
('seo blog post','SEO-Optimized Blog Post','A keyword-driven blog built to rank on page one.',59.00,'/icons/blog.png',NULL),
('bullet point rewrite','Bullet Point Rewrite','Optimize your bullet points with high-performance, persuasive language.',39.00,'/icons/bullet point rewrite.png',NULL),
('faq section','FAQ Section','Answer buyer questions before they''re asked with a customer-focused FAQ.',29.00,'/icons/faq section.png',NULL),
('comparison table','Comparison Table','Make decision-making easy with a side-by-side comparison.',39.00,'/icons/comparison table.png',NULL),
('seo titles metadata','SEO Titles & Metadata','Keyword-smart titles that speak to humans and search engines.',39.00,'/icons/seo.png',NULL),
('full site audit','Full Site Audit','We''ll review your store and provide clear, usable feedback you can apply immediately.',179.00,'/icons/full site audit.png',NULL),
('launch kit','Launch Kit','Everything you need to launch new products with confidence.',119.00,'/icons/launch kit.png',NULL),
('expansion kit','Expansion Kit','A smart choice for stores expanding their lineup or revamping old content.',149.00,'/icons/expansion kit.png',NULL),
('conversion booster','Conversion Booster','Revive sluggish listings and amplify your most visited pages.',129.00,'/icons/conversion booster.png',NULL),
('amazon product description','Amazon Product Description','Optimized for Amazon''s algorithm and shopper behavior.',49.00,'/icons/amazon product description.png',NULL),
('amazon bullet points rewrite','Amazon Bullet Points Rewrite','High-performance bullet points designed to boost CTR and conversions.',39.00,'/icons/amazon bullet point rewrite.png',NULL),
('Enhanced Amazon Content','Enhanced Amazon Content','Strategically crafted narratives built to fit Amazon''s visual structure.',59.00,'/icons/enhanced amazon content.png',NULL),
('split test variants','Split Test Variants','A/B test multiple versions to see which converts best (includes 2 variants).',69.00,'/icons/split test variants.png',NULL),
('branding voice guidelines','Branding Voice Guidelines','Define voice, tone, and messaging pillars for consistent content.',89.00,'/icons/branding voice guidelines.png',NULL),
('amazon power pack','Amazon Power Pack','Amazon-optimized description, bullet points, and A+ content.',129.00,'/icons/amazon power pack.png',NULL),
('store revamp kit','Store Revamp Kit','Revitalize your store with expert insight and high impact descriptions.',199.00,'/icons/store revamp kit.png',NULL),
('ongoing optimization','Ongoing Optimization','Structured to adapt, improve and help scale your goals.',149.00,'/icons/ongoing optimization.png',NULL),
('conversion booster pro','Conversion Booster Pro','Targeted improvements designed to turn traffic into sales.',169.00,'/icons/conversion booster pro.png',NULL)
ON CONFLICT (id) DO UPDATE
SET title = EXCLUDED.title,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    icon = EXCLUDED.icon,
    stripe_id = EXCLUDED.stripe_id;
