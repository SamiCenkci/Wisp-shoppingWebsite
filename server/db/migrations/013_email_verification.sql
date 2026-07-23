ALTER TABLE users ADD COLUMN verified_at TIMESTAMPTZ;

CREATE TABLE verification_tokens (
    token      TEXT PRIMARY KEY,
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_verification_tokens_user ON verification_tokens(user_id);

-- Existing accounts are grandfathered in — they were created before
-- verification existed, so locking them out would be unfair.
UPDATE users SET verified_at = NOW() WHERE verified_at IS NULL;