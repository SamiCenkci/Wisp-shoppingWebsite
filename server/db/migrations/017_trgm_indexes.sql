-- Search does `title ILIKE '%term%'` and `similarity(title, $1)`, neither of
-- which a btree index can serve — so every search was a full table scan.
-- GIN with gin_trgm_ops indexes the trigrams themselves.
CREATE INDEX idx_listings_title_trgm ON listings USING GIN (title gin_trgm_ops);
CREATE INDEX idx_listings_description_trgm ON listings USING GIN (description gin_trgm_ops);