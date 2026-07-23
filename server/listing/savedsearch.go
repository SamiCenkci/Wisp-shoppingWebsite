package listing

import (
	"context"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	db "github.com/SamiCenkci/Shopping-Website/db/generated"
	"github.com/SamiCenkci/Shopping-Website/email"
)

type savedSearchRequest struct {
	Name            string            `json:"name" binding:"required,max=100"`
	Query           string            `json:"query" binding:"max=200"`
	Category        string            `json:"category" binding:"max=100"`
	SubCategory     string            `json:"sub_category" binding:"max=100"`
	ProductCategory string            `json:"product_category" binding:"max=100"`
	Attributes      map[string]string `json:"attributes"`
	Place           string            `json:"place" binding:"max=100"`
	Condition       string            `json:"condition" binding:"max=30"`
	AdType          string            `json:"ad_type" binding:"max=30"`
	MinPrice        int32             `json:"min_price"`
	MaxPrice        int32             `json:"max_price"`
}

// POST /api/saved-searches
func (h *Handler) CreateSavedSearch(c *gin.Context) {
	userID, err := uuid.Parse(c.GetString("userID"))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user"})
		return
	}

	var req savedSearchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	saved, err := h.Queries.CreateSavedSearch(context.Background(), db.CreateSavedSearchParams{
		UserID:          pgUUID(userID),
		Name:            req.Name,
		Query:           req.Query,
		Category:        req.Category,
		SubCategory:     req.SubCategory,
		ProductCategory: req.ProductCategory,
		Attributes:      attrsJSON(req.Attributes),
		Place:           req.Place,
		Condition:       req.Condition,
		AdType:          req.AdType,
		MinPrice:        req.MinPrice,
		MaxPrice:        req.MaxPrice,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, saved)
}

// GET /api/saved-searches
func (h *Handler) ListSavedSearches(c *gin.Context) {
	userID, err := uuid.Parse(c.GetString("userID"))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user"})
		return
	}

	searches, err := h.Queries.ListSavedSearchesByUser(context.Background(), pgUUID(userID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if searches == nil {
		searches = []db.SavedSearch{}
	}

	c.JSON(http.StatusOK, searches)
}

// DELETE /api/saved-searches/:id
func (h *Handler) DeleteSavedSearch(c *gin.Context) {
	userID, err := uuid.Parse(c.GetString("userID"))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user"})
		return
	}
	searchID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	// The query only matches when user_id belongs to the caller.
	if err := h.Queries.DeleteSavedSearch(context.Background(), db.DeleteSavedSearchParams{
		ID:     pgUUID(searchID),
		UserID: pgUUID(userID),
	}); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "søk slettet"})
}

// POST /api/internal/run-alerts
//
// Called by an external scheduler, not by users. Render's free tier has no cron
// and sleeps when idle, so an inbound request is what wakes it and triggers the run.
func (h *Handler) RunAlerts(c *gin.Context) {
	if h.AlertSecret == "" || c.GetHeader("X-Alert-Secret") != h.AlertSecret {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	searches, err := h.Queries.ListAllSavedSearches(context.Background())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	checked, notified := 0, 0

	for _, s := range searches {
		checked++
		since := s.LastCheckedAt.Time

		req := searchRequest{
			Query:           s.Query,
			Category:        s.Category,
			SubCategory:     s.SubCategory,
			ProductCategory: s.ProductCategory,
			Attributes:      decodeAttrs(s.Attributes),
			Place:           s.Place,
			Condition:       s.Condition,
			AdType:          s.AdType,
			MinPrice:        s.MinPrice,
			MaxPrice:        s.MaxPrice,
			CreatedSince:    &since,
		}

		sql, args := buildSearchQuery(req)

		rows, err := h.Pool.Query(context.Background(), sql, args...)
		if err != nil {
			log.Printf("alerts: query failed for search %v: %v", s.ID, err)
			continue
		}
		matches, err := pgx.CollectRows(rows, pgx.RowToStructByName[db.Listing])
		rows.Close()
		if err != nil {
			log.Printf("alerts: scan failed for search %v: %v", s.ID, err)
			continue
		}

		// Always advance the checkpoint, even with no matches, so the window
		// doesn't grow unbounded.
		_ = h.Queries.TouchSavedSearch(context.Background(), s.ID)

		if len(matches) == 0 || h.Email == nil {
			continue
		}

		name := s.UserName
		if s.UserDisplayName != "" {
			name = s.UserDisplayName
		}

		items := make([]email.AlertItem, 0, len(matches))
		for _, m := range matches {
			items = append(items, email.AlertItem{
				ID:       uuid.UUID(m.ID.Bytes).String(),
				Title:    m.Title,
				PriceOre: m.PriceOre,
				Place:    m.Municipality,
			})
		}

		h.Email.SendSavedSearchAlert(s.Email, name, s.Name, items)
		notified++
	}

	c.JSON(http.StatusOK, gin.H{"checked": checked, "notified": notified})
}

// decodeAttrs turns the stored JSONB back into a map for the query builder.
func decodeAttrs(raw []byte) map[string]string {
	m := map[string]string{}
	if len(raw) == 0 {
		return m
	}
	_ = jsonUnmarshal(raw, &m)
	return m
}
