-- Track which buyer a listing was sold to
ALTER TABLE listings ADD COLUMN sold_to UUID REFERENCES users(id) ON DELETE SET NULL;

-- Reviews between buyer and seller after a completed sale
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reviewed_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    communication INTEGER NOT NULL CHECK (communication BETWEEN 1 AND 5),
    reliability INTEGER NOT NULL CHECK (reliability BETWEEN 1 AND 5),
    as_described INTEGER NOT NULL CHECK (as_described BETWEEN 1 AND 5),
    comment TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (listing_id, reviewer_id)
);

CREATE INDEX idx_reviews_reviewed_user ON reviews(reviewed_user_id);