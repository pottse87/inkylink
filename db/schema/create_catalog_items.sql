CREATE TABLE IF NOT EXISTS catalog_items (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC NOT NULL,
  icon TEXT NOT NULL,
  stripe_id TEXT NOT NULL,
  includes TEXT,
  color TEXT
);
