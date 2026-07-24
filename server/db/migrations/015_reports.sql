CREATE TABLE reports (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id  UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason      TEXT NOT NULL,
    details     TEXT NOT NULL DEFAULT '',
    status      TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewed', 'dismissed')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (listing_id, reporter_id)
);

CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_listing ON reports(listing_id);

-- Who can see the moderation view.
ALTER TABLE users ADD COLUMN is_admin BOOLEAN NOT NULL DEFAULT FALSE;