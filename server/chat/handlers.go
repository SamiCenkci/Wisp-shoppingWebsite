package chat

import (
	"context"
	"net/http"
	"time"

	db "github.com/SamiCenkci/Shopping-Website/db/generated"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"github.com/jackc/pgx/v5/pgtype"
)

type Handler struct {
	Queries *db.Queries
	Hub     *Hub
}

func pgUUID(id uuid.UUID) pgtype.UUID {
	return pgtype.UUID{Bytes: id, Valid: true}
}

type startRequest struct {
	ListingID string `json:"listing_id" binding:"required"`
	SellerID  string `json:"seller_id" binding:"required"`
}

func (h *Handler) Start(c *gin.Context) {
	userIDStr := c.GetString("userID")
	buyerID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user"})
		return
	}

	var req startRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	listingID, err := uuid.Parse(req.ListingID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid listing id"})
		return
	}
	sellerID, err := uuid.Parse(req.SellerID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid seller id"})
		return
	}

	if buyerID == sellerID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "du kan ikke sende melding til deg selv"})
		return
	}

	conv, err := h.Queries.GetOrCreateConversation(context.Background(), db.GetOrCreateConversationParams{
		ListingID: pgUUID(listingID),
		BuyerID:   pgUUID(buyerID),
		SellerID:  pgUUID(sellerID),
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, conv)
}

// GET /api/conversations  (my conversations, enriched)
func (h *Handler) List(c *gin.Context) {
	userIDStr := c.GetString("userID")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user"})
		return
	}

	convs, err := h.Queries.ListConversationsForUser(context.Background(), pgUUID(userID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	type enriched struct {
		db.Conversation
		OtherName    string `json:"other_name"`
		ListingTitle string `json:"listing_title"`
		ListingImage string `json:"listing_image"`
		LastMessage  string `json:"last_message"`
	}

	out := make([]enriched, 0, len(convs))
	for _, conv := range convs {
		e := enriched{Conversation: conv}

		otherID := conv.SellerID
		if conv.SellerID.Bytes == [16]byte(userID) {
			otherID = conv.BuyerID
		}
		if other, err := h.Queries.GetUserByID(context.Background(), otherID); err == nil {
			e.OtherName = other.Name
			if other.DisplayName != "" {
				e.OtherName = other.DisplayName
			}
		}

		if listing, err := h.Queries.GetListingByID(context.Background(), conv.ListingID); err == nil {
			e.ListingTitle = listing.Title
			if imgs, err := h.Queries.GetImagesByListing(context.Background(), conv.ListingID); err == nil && len(imgs) > 0 {
				e.ListingImage = imgs[0].Url
			}
		}

		if msgs, err := h.Queries.ListMessages(context.Background(), conv.ID); err == nil && len(msgs) > 0 {
			e.LastMessage = msgs[len(msgs)-1].Content
		}

		out = append(out, e)
	}

	c.JSON(http.StatusOK, out)
}

// GET /api/conversations/:id/messages
func (h *Handler) Messages(c *gin.Context) {
	userIDStr := c.GetString("userID")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user"})
		return
	}

	convID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	conv, err := h.Queries.GetConversationByID(context.Background(), pgUUID(convID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "conversation not found"})
		return
	}
	if conv.BuyerID.Bytes != [16]byte(userID) && conv.SellerID.Bytes != [16]byte(userID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "ikke din samtale"})
		return
	}

	msgs, err := h.Queries.ListMessages(context.Background(), pgUUID(convID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	_ = h.Queries.MarkMessagesRead(context.Background(), db.MarkMessagesReadParams{
		ConversationID: pgUUID(convID),
		SenderID:       pgUUID(userID),
	})

	c.JSON(http.StatusOK, msgs)
}

type sendRequest struct {
	Content string `json:"content" binding:"required"`
}

func (h *Handler) Send(c *gin.Context) {
	userIDStr := c.GetString("userID")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user"})
		return
	}

	convID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	conv, err := h.Queries.GetConversationByID(context.Background(), pgUUID(convID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "conversation not found"})
		return
	}
	if conv.BuyerID.Bytes != [16]byte(userID) && conv.SellerID.Bytes != [16]byte(userID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "ikke din samtale"})
		return
	}

	var req sendRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	msg, err := h.Queries.CreateMessage(context.Background(), db.CreateMessageParams{
		ConversationID: pgUUID(convID),
		SenderID:       pgUUID(userID),
		Content:        req.Content,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	_ = h.Queries.TouchConversation(context.Background(), pgUUID(convID))

	var recipientID string
	if conv.BuyerID.Bytes == [16]byte(userID) {
		recipientID = uuid.UUID(conv.SellerID.Bytes).String()
	} else {
		recipientID = uuid.UUID(conv.BuyerID.Bytes).String()
	}
	if h.Hub != nil {
		h.Hub.SendToUser(recipientID, gin.H{
			"type":            "message",
			"conversation_id": convID.String(),
			"message":         msg,
		})
	}

	c.JSON(http.StatusCreated, msg)
}

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func (h *Handler) WebSocket(c *gin.Context) {
	userID := c.GetString("userID")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "not authenticated"})
		return
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		return
	}

	h.Hub.Add(userID, conn)

	go func() {
		defer func() {
			h.Hub.Remove(userID, conn)
			conn.Close()
		}()
		conn.SetReadDeadline(time.Now().Add(120 * time.Second))
		conn.SetPongHandler(func(string) error {
			conn.SetReadDeadline(time.Now().Add(120 * time.Second))
			return nil
		})
		for {
			if _, _, err := conn.ReadMessage(); err != nil {
				break
			}
		}
	}()
}
