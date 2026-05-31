-- name: GetOrCreateConversation :one
INSERT INTO conversations (listing_id, buyer_id, seller_id)
VALUES ($1, $2, $3)
ON CONFLICT (listing_id, buyer_id) DO UPDATE SET updated_at = NOW()
RETURNING *;

-- name: GetConversationByID :one
SELECT * FROM conversations WHERE id = $1;

-- name: ListConversationsForUser :many
SELECT * FROM conversations
WHERE buyer_id = $1 OR seller_id = $1
ORDER BY updated_at DESC;

-- name: CreateMessage :one
INSERT INTO messages (conversation_id, sender_id, content)
VALUES ($1, $2, $3)
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