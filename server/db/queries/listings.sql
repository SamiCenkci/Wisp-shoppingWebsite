-- name: CreateListing :one
INSERT INTO listings (user_id, title, description, price_ore, category, subcategory, condition, county, municipality, ad_type, street_address, postal_code, latitude, longitude)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
RETURNING *;

-- name: GetListingByID :one
SELECT * FROM listings WHERE id = $1;

-- name: ListListings :many
SELECT * FROM listings
WHERE status = 'active'
  AND created_at > NOW() - INTERVAL '60 days'
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: ListListingsByUser :many
SELECT * FROM listings
WHERE user_id = $1
ORDER BY created_at DESC;

-- name: UpdateListing :one
UPDATE listings
SET title = $2, description = $3, price_ore = $4, category = $5,
    subcategory = $6, condition = $7, county = $8, municipality = $9,
    street_address = $10, postal_code = $11, latitude = $12, longitude = $13,
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteListing :exec
DELETE FROM listings WHERE id = $1;

-- name: GetSimilarListings :many
SELECT * FROM listings
WHERE category = $1 AND id != $2
  AND status = 'active'
  AND created_at > NOW() - INTERVAL '60 days'
ORDER BY created_at DESC
LIMIT 4;

-- name: UpdateListingStatus :exec
UPDATE listings SET status = $2 WHERE id = $1;

-- name: MarkListingSold :exec
UPDATE listings SET status = 'sold', sold_to = $2 WHERE id = $1;

-- name: IncrementViewCount :exec
UPDATE listings SET view_count = view_count + 1 WHERE id = $1;