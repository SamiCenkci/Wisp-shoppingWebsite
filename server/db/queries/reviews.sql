-- name: CreateReview :one
INSERT INTO reviews (listing_id, reviewer_id, reviewed_user_id, communication, reliability, as_described, comment)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

-- name: ListReviewsForUser :many
SELECT r.*, u.name AS reviewer_name, u.display_name AS reviewer_display_name, l.title AS listing_title
FROM reviews r
JOIN users u ON u.id = r.reviewer_id
JOIN listings l ON l.id = r.listing_id
WHERE r.reviewed_user_id = $1
ORDER BY r.created_at DESC;

-- name: GetUserRatingSummary :one
SELECT
  COUNT(*) AS review_count,
  COALESCE(AVG((communication + reliability + as_described)::numeric / 3), 0) AS average_rating
FROM reviews
WHERE reviewed_user_id = $1;

-- name: HasReviewed :one
SELECT EXISTS (
  SELECT 1 FROM reviews WHERE listing_id = $1 AND reviewer_id = $2
);

-- name: GetReviewByID :one
SELECT * FROM reviews WHERE id = $1;

-- name: DeleteReview :exec
DELETE FROM reviews WHERE id = $1 AND reviewer_id = $2;

-- name: ReplyToReview :exec
UPDATE reviews SET reply = $3, replied_at = NOW()
WHERE id = $1 AND reviewed_user_id = $2;

-- name: ListReviewsByReviewer :many
SELECT r.*, u.name AS reviewed_name, u.display_name AS reviewed_display_name, l.title AS listing_title
FROM reviews r
JOIN users u ON u.id = r.reviewed_user_id
JOIN listings l ON l.id = r.listing_id
WHERE r.reviewer_id = $1
ORDER BY r.created_at DESC;