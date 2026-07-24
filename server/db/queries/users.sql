-- name: CreateUser :one
INSERT INTO users (email, password_hash, name)
VALUES ($1, $2, $3)
RETURNING *;

-- name: GetUserByEmail :one
SELECT * FROM users WHERE email = $1;

-- name: GetUserByID :one
SELECT * FROM users WHERE id = $1;

-- name: MarkEmailVerified :exec
UPDATE users SET email_verified = true WHERE id = $1;

-- name: UpdateProfile :one
UPDATE users SET
  name = $2,
  avatar_url = $3,
  display_name = $4,
  bio = $5,
  phone = $6,
  birth_year = $7,
  gender = $8,
  street_address = $9,
  postal_code = $10,
  city = $11,
  country = $12
WHERE id = $1
RETURNING *;

-- name: ListActiveListingsByUser :many
SELECT * FROM listings
WHERE user_id = $1 AND status = 'active'
  AND deleted_at IS NULL
  AND created_at > NOW() - INTERVAL '60 days'
ORDER BY created_at DESC;