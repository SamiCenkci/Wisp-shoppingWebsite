-- name: CreateVerificationToken :exec
INSERT INTO verification_tokens (token, user_id, expires_at)
VALUES ($1, $2, $3);

-- name: GetVerificationToken :one
SELECT * FROM verification_tokens WHERE token = $1;

-- name: DeleteVerificationTokensForUser :exec
DELETE FROM verification_tokens WHERE user_id = $1;

-- name: MarkUserVerified :exec
UPDATE users SET verified_at = NOW() WHERE id = $1;

-- name: DeleteExpiredVerificationTokens :exec
DELETE FROM verification_tokens WHERE expires_at < NOW();