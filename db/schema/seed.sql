-- tables (idempotent)
CREATE TABLE IF NOT EXISTS public.catalog_items (
  id text PRIMARY KEY,
  title text,
  description text,
  price numeric,
  icon text,
  stripe_id text
);

CREATE TABLE IF NOT EXISTS public.carts (
  client_id text PRIMARY KEY,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY,
  client_id text NOT NULL,
  total_cents integer NOT NULL,
  currency text NOT NULL,
  status text NOT NULL,
  source text,
  idempotency_key text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.order_items (
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  item_id text NOT NULL,
  name text,
  description text,
  price_cents integer NOT NULL DEFAULT 0,
  quantity integer NOT NULL DEFAULT 1,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.order_events (
  id bigserial PRIMARY KEY,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- seed only the items you actually use (you can add the rest later)
INSERT INTO public.catalog_items (id, title, description, price, icon, stripe_id) VALUES
('product description','Product Description','Stand out in search with expertly crafted product descriptions.',39.00,'/icons/desc.png',''),
('product overview','Product Overview','Highlight your product in a quick, easy-to-read snapshot.',29.00,'/icons/overview.png',''),
('welcome email','Welcome Email','Make a lasting first impression with a warm, professional welcome.',39.00,'/icons/welcome.png',''),
('product drop email','Product Drop Email','Announce your new product with a sharp branded impact.',39.00,'/icons/drop.png',''),
('seo blog post','SEO-Optimized Blog Post','A keyword-driven blog built to rank on page one.',59.00,'/icons/blog.png',''),
('bullet point rewrite','Bullet Point Rewrite','Optimize your bullet points with persuasive language.',39.00,'/icons/bullet point rewrite.png',''),
('faq section','FAQ Section','Answer buyer questions before they''re asked.',29.00,'/icons/faq section.png',''),
('comparison table','Comparison Table','Side-by-side comparison.',39.00,'/icons/comparison table.png',''),
('seo titles metadata','SEO Titles & Metadata','Keyword-smart titles and metadata.',39.00,'/icons/seo.png','')
ON CONFLICT (id) DO UPDATE
SET title = EXCLUDED.title,
    description = EXCLUDED.description,
    price = EXCLUDED.price,
    icon = EXCLUDED.icon,
    stripe_id = EXCLUDED.stripe_id;
