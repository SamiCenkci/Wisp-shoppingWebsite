-- name: CreateListing :one
INSERT INTO listings (user_id, title, description, price_ore, category, condition, county, municipality, ad_type, street_address, postal_code, latitude, longitude, sub_category, product_category, attributes)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
RETURNING *;

-- name: GetListingByID :one
-- Deliberately returns soft-deleted listings: the detail page shows a
-- "slettet" state and chat still needs the title.
SELECT * FROM listings WHERE id = $1;

-- name: ListListings :many
SELECT * FROM listings
WHERE status = 'active'
  AND deleted_at IS NULL
  AND created_at > NOW() - INTERVAL '60 days'
ORDER BY created_at DESC
LIMIT $1 OFFSET $2;

-- name: ListListingsByUser :many
SELECT * FROM listings
WHERE user_id = $1 AND deleted_at IS NULL
ORDER BY created_at DESC;

-- name: UpdateListing :one
UPDATE listings
SET title = $2, description = $3, price_ore = $4, category = $5,
    condition = $6, county = $7, municipality = $8,
    street_address = $9, postal_code = $10, latitude = $11, longitude = $12,
    sub_category = $13, product_category = $14, attributes = $15,
    updated_at = NOW()
WHERE id = $1
RETURNING *;

-- name: DeleteListing :exec
-- Soft delete, so conversations and reviews attached to this listing survive.
UPDATE listings SET deleted_at = NOW() WHERE id = $1;

-- name: GetSimilarListings :many
SELECT * FROM listings
WHERE category = $1 AND id != $2
  AND status = 'active'
  AND deleted_at IS NULL
  AND created_at > NOW() - INTERVAL '60 days'
ORDER BY created_at DESC
LIMIT 4;

-- name: UpdateListingStatus :exec
UPDATE listings SET status = $2 WHERE id = $1;

-- name: MarkListingSold :exec
UPDATE listings SET status = 'sold', sold_to = $2 WHERE id = $1;

-- name: IncrementViewCount :exec
UPDATE listings SET view_count = view_count + 1 WHERE id = $1;

-- name: GetImagesForActiveListings :many
SELECT i.* FROM listing_images i
JOIN listings l ON l.id = i.listing_id
WHERE l.id = ANY(sqlc.slice('listing_ids'))
ORDER BY i.listing_id, i.sort_order;