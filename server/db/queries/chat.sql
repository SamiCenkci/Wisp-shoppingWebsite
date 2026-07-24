-- name: GetOrCreateConversation :one
INSERT INTO conversations (listing_id, buyer_id, seller_id)
VALUES ($1, $2, $3)
ON CONFLICT (listing_id, buyer_id) DO UPDATE SET updated_at = NOW()
RETURNING *;

-- name: GetConversationByID :one
SELECT * FROM conversations WHERE id = $1;

-- name: ListConversationsForUser :many
-- Empty conversations are hidden: clicking "Send melding til selger" creates one
-- before anything is written, and a thread with no messages is just noise.
SELECT c.* FROM conversations c
WHERE (c.buyer_id = $1 OR c.seller_id = $1)
  AND EXISTS (SELECT 1 FROM messages m WHERE m.conversation_id = c.id)
ORDER BY c.updated_at DESC;

-- name: CreateMessage :one
INSERT INTO messages (conversation_id, sender_id, content, attachment_url, attachment_name)
VALUES ($1, $2, $3, $4, $5)
RETURNING *;

-- name: ListMessages :many
SELECT * FROM messages
WHERE conversation_id = $1
ORDER BY created_at ASC;

-- name: TouchConversation :exec
UPDATE conversations SET updated_at = NOW() WHERE id = $1;

-- name: MarkMessagesRead :exec
UPDATE messages SET read_at = NOW()
WHERE conversation_id = $1 AND sender_id != $2 AND read_at IS NULL;

-- name: CountUnreadForUser :one
SELECT COUNT(*) FROM messages m
JOIN conversations c ON c.id = m.conversation_id
WHERE (c.buyer_id = $1 OR c.seller_id = $1)
  AND m.sender_id != $1
  AND m.read_at IS NULL;

-- name: CountUnreadInConversation :one
SELECT COUNT(*) FROM messages
WHERE conversation_id = $1
  AND sender_id != $2
  AND read_at IS NULL;

-- name: ListBuyersForListing :many
-- Only buyers who actually wrote something — an empty conversation doesn't
-- mean someone was interested enough to be a real buyer.
SELECT DISTINCT u.id, u.name, u.display_name
FROM conversations c
JOIN users u ON u.id = c.buyer_id
WHERE c.listing_id = $1
  AND EXISTS (SELECT 1 FROM messages m WHERE m.conversation_id = c.id);