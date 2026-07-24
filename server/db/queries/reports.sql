-- name: CreateReport :one
INSERT INTO reports (listing_id, reporter_id, reason, details)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: HasReported :one
SELECT EXISTS (
  SELECT 1 FROM reports WHERE listing_id = $1 AND reporter_id = $2
);

-- name: ListReports :many
SELECT r.*,
       l.title AS listing_title,
       l.status AS listing_status,
       l.deleted_at AS listing_deleted_at,
       u.name AS reporter_name,
       u.display_name AS reporter_display_name
FROM reports r
JOIN listings l ON l.id = r.listing_id
JOIN users u ON u.id = r.reporter_id
ORDER BY
  CASE r.status WHEN 'open' THEN 0 ELSE 1 END,
  r.created_at DESC;

-- name: UpdateReportStatus :exec
UPDATE reports SET status = $2 WHERE id = $1;

-- name: CountOpenReports :one
SELECT COUNT(*) FROM reports WHERE status = 'open';