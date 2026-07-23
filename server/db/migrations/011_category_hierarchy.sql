-- 'category' continues to hold Hovedkategori.
ALTER TABLE listings ADD COLUMN sub_category TEXT NOT NULL DEFAULT '';
ALTER TABLE listings ADD COLUMN product_category TEXT NOT NULL DEFAULT '';
ALTER TABLE listings ADD COLUMN attributes JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX idx_listings_sub_category ON listings(sub_category);
CREATE INDEX idx_listings_attributes ON listings USING GIN (attributes);