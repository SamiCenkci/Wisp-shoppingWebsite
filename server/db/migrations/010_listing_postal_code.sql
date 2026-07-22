ALTER TABLE listings ADD COLUMN postal_code TEXT NOT NULL DEFAULT '';
CREATE INDEX idx_listings_postal_code ON listings(postal_code);