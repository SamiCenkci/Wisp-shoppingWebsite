ALTER TABLE listings
ADD COLUMN ad_type TEXT NOT NULL DEFAULT 'sale'
CHECK (ad_type IN ('sale', 'giveaway'));