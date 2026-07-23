CREATE TABLE saved_searches (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    query           TEXT NOT NULL DEFAULT '',
    category        TEXT NOT NULL DEFAULT '',
    sub_category    TEXT NOT NULL DEFAULT '',
    product_category TEXT NOT NULL DEFAULT '',
    attributes      JSONB NOT NULL DEFAULT '{}'::jsonb,
    place           TEXT NOT NULL DEFAULT '',
    condition       TEXT NOT NULL DEFAULT '',
    ad_type         TEXT NOT NULL DEFAULT '',
    min_price       INTEGER NOT NULL DEFAULT 0,
    max_price       INTEGER NOT NULL DEFAULT 0,
    last_checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_saved_searches_user ON saved_searches(user_id);