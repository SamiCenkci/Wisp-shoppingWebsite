-- name: AddFavorite :exec
INSERT INTO favorites (user_id, listing_id)
VALUES ($1, $2)
ON CONFLICT (user_id, listing_id) DO NOTHING;

-- name: RemoveFavorite :exec
DELETE FROM favorites WHERE user_id = $1 AND listing_id = $2;

-- name: CountFavorites :one
SELECT COUNT(*) FROM favorites WHERE listing_id = $1;

-- name: IsFavorited :one
SELECT EXISTS (
  SELECT 1 FROM favorites WHERE user_id = $1 AND listing_id = $2
);

-- name: ListFavoriteIDsByUser :many
SELECT listing_id FROM favorites WHERE user_id = $1;

-- name: ListFavoriteListingsByUser :many
SELECT l.* FROM listings l
JOIN favorites f ON f.listing_id = l.id
WHERE f.user_id = $1 AND l.deleted_at IS NULL
ORDER BY f.created_at DESC;