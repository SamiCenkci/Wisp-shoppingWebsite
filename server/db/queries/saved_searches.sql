-- name: CreateSavedSearch :one
INSERT INTO saved_searches (
    user_id, name, query, category, sub_category, product_category,
    attributes, place, condition, ad_type, min_price, max_price
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
RETURNING *;

-- name: ListSavedSearchesByUser :many
SELECT * FROM saved_searches
WHERE user_id = $1
ORDER BY created_at DESC;

-- name: DeleteSavedSearch :exec
DELETE FROM saved_searches WHERE id = $1 AND user_id = $2;

-- name: ListAllSavedSearches :many
SELECT s.*, u.email, u.name AS user_name, u.display_name AS user_display_name
FROM saved_searches s
JOIN users u ON u.id = s.user_id;

-- name: TouchSavedSearch :exec
UPDATE saved_searches SET last_checked_at = NOW() WHERE id = $1;