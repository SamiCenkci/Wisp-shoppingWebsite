package listing

import (
	"context"
	"net/http"
	"strconv"

	db "github.com/SamiCenkci/Shopping-Website/db/generated"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Handler struct {
	Queries *db.Queries
	Pool    *pgxpool.Pool
}

type createRequest struct {
	Title        string   `json:"title" binding:"required"`
	Description  string   `json:"description" binding:"required"`
	PriceOre     int32    `json:"price_ore" binding:"required,min=0"`
	Category     string   `json:"category" binding:"required"`
	Subcategory  string   `json:"subcategory"`
	Condition    string   `json:"condition" binding:"required"`
	County       string   `json:"county" binding:"required"`
	Municipality string   `json:"municipality" binding:"required"`
	AdType       string   `json:"ad_type"`
	Images       []string `json:"images"`
}

func (h *Handler) Create(c *gin.Context) {
	var req createRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userIDStr := c.GetString("userID")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user"})
		return
	}

	adType := req.AdType
	if adType != "giveaway" {
		adType = "sale"
	}

	listing, err := h.Queries.CreateListing(context.Background(), db.CreateListingParams{
		UserID:       pgUUID(userID),
		Title:        req.Title,
		Description:  req.Description,
		PriceOre:     req.PriceOre,
		Category:     req.Category,
		Subcategory:  pgText(req.Subcategory),
		Condition:    req.Condition,
		County:       req.County,
		Municipality: req.Municipality,
		AdType:       adType,
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	for i, url := range req.Images {
		_, _ = h.Queries.AddListingImage(context.Background(), db.AddListingImageParams{
			ListingID: listing.ID,
			Url:       url,
			SortOrder: int32(i),
		})
	}

	c.JSON(http.StatusCreated, listing)
}

func (h *Handler) List(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))

	listings, err := h.Queries.ListListings(context.Background(), db.ListListingsParams{
		Limit:  int32(limit),
		Offset: int32(offset),
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	type listingWithImages struct {
		db.Listing
		Images []db.ListingImage `json:"images"`
	}
	result := make([]listingWithImages, 0, len(listings))
	for _, l := range listings {
		imgs, _ := h.Queries.GetImagesByListing(context.Background(), l.ID)
		if imgs == nil {
			imgs = []db.ListingImage{}
		}
		result = append(result, listingWithImages{Listing: l, Images: imgs})
	}

	c.JSON(http.StatusOK, result)
}

func (h *Handler) GetOne(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}
	listing, err := h.Queries.GetListingByID(context.Background(), pgUUID(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "listing not found"})
		return
	}

	images, _ := h.Queries.GetImagesByListing(context.Background(), listing.ID)

	seller, _ := h.Queries.GetUserByID(context.Background(), listing.UserID)

	similar, _ := h.Queries.GetSimilarListings(context.Background(), db.GetSimilarListingsParams{
		Category: listing.Category,
		ID:       listing.ID,
	})

	type listingWithImages struct {
		db.Listing
		Images []db.ListingImage `json:"images"`
	}
	similarOut := make([]listingWithImages, 0, len(similar))
	for _, s := range similar {
		imgs, _ := h.Queries.GetImagesByListing(context.Background(), s.ID)
		if imgs == nil {
			imgs = []db.ListingImage{}
		}
		similarOut = append(similarOut, listingWithImages{Listing: s, Images: imgs})
	}

	c.JSON(http.StatusOK, gin.H{
		"listing": listing,
		"images":  images,
		"similar": similarOut,
		"seller": gin.H{
			"id":           seller.ID,
			"name":         seller.Name,
			"display_name": seller.DisplayName,
			"avatar_url":   seller.AvatarUrl.String,
			"created_at":   seller.CreatedAt.Time,
		},
	})
}

func (h *Handler) Update(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	existing, err := h.Queries.GetListingByID(context.Background(), pgUUID(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "listing not found"})
		return
	}

	userIDStr := c.GetString("userID")
	if existing.UserID.Bytes != mustParse(userIDStr) {
		c.JSON(http.StatusForbidden, gin.H{"error": "you can only edit your own listings"})
		return
	}

	var req createRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updated, err := h.Queries.UpdateListing(context.Background(), db.UpdateListingParams{
		ID:           pgUUID(id),
		Title:        req.Title,
		Description:  req.Description,
		PriceOre:     req.PriceOre,
		Category:     req.Category,
		Subcategory:  pgText(req.Subcategory),
		Condition:    req.Condition,
		County:       req.County,
		Municipality: req.Municipality,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, updated)
}

func (h *Handler) Delete(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	existing, err := h.Queries.GetListingByID(context.Background(), pgUUID(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "listing not found"})
		return
	}

	userIDStr := c.GetString("userID")
	if existing.UserID.Bytes != mustParse(userIDStr) {
		c.JSON(http.StatusForbidden, gin.H{"error": "you can only delete your own listings"})
		return
	}

	if err := h.Queries.DeleteListing(context.Background(), pgUUID(id)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "listing deleted"})
}

type searchRequest struct {
	Query     string `json:"query"`
	Category  string `json:"category"`
	County    string `json:"county"`
	Condition string `json:"condition"`
	AdType    string `json:"ad_type"`
	MinPrice  int32  `json:"min_price"`
	MaxPrice  int32  `json:"max_price"`
	SortBy    string `json:"sort_by"`
}

func (h *Handler) Search(c *gin.Context) {
	var req searchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	sql := "SELECT * FROM listings WHERE status = 'active' AND created_at > NOW() - INTERVAL '60 days'"
	args := []interface{}{}
	argN := 1

	if req.Query != "" {
		p := strconv.Itoa(argN)
		sql += " AND (title ILIKE $" + p +
			" OR description ILIKE $" + p +
			" OR similarity(title, $" + strconv.Itoa(argN+1) + ") > 0.2)"
		args = append(args, "%"+req.Query+"%")
		args = append(args, req.Query)
		argN += 2
	}

	if req.Category != "" {
		sql += " AND category = $" + strconv.Itoa(argN)
		args = append(args, req.Category)
		argN++
	}
	if req.County != "" {
		sql += " AND county = $" + strconv.Itoa(argN)
		args = append(args, req.County)
		argN++
	}
	if req.Condition != "" {
		sql += " AND condition = $" + strconv.Itoa(argN)
		args = append(args, req.Condition)
		argN++
	}
	if req.AdType != "" {
		sql += " AND ad_type = $" + strconv.Itoa(argN)
		args = append(args, req.AdType)
		argN++
	}
	if req.MinPrice > 0 {
		sql += " AND price_ore >= $" + strconv.Itoa(argN)
		args = append(args, req.MinPrice)
		argN++
	}
	if req.MaxPrice > 0 {
		sql += " AND price_ore <= $" + strconv.Itoa(argN)
		args = append(args, req.MaxPrice)
		argN++
	}

	switch req.SortBy {
	case "price_asc":
		sql += " ORDER BY price_ore ASC"
	case "price_desc":
		sql += " ORDER BY price_ore DESC"
	default:
		if req.Query != "" {
			sql += " ORDER BY similarity(title, '" + sanitize(req.Query) + "') DESC, created_at DESC"
		} else {
			sql += " ORDER BY created_at DESC"
		}
	}

	sql += " LIMIT 50"

	rows, err := h.Pool.Query(context.Background(), sql, args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	defer rows.Close()

	results, err := pgx.CollectRows(rows, pgx.RowToStructByName[db.Listing])
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	type listingWithImages struct {
		db.Listing
		Images []db.ListingImage `json:"images"`
	}
	out := make([]listingWithImages, 0, len(results))
	for _, l := range results {
		imgs, _ := h.Queries.GetImagesByListing(context.Background(), l.ID)
		if imgs == nil {
			imgs = []db.ListingImage{}
		}
		out = append(out, listingWithImages{Listing: l, Images: imgs})
	}

	c.JSON(http.StatusOK, out)
}

func (h *Handler) Mine(c *gin.Context) {
	userIDStr := c.GetString("userID")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user"})
		return
	}

	listings, err := h.Queries.ListListingsByUser(context.Background(), pgUUID(userID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	type listingWithImages struct {
		db.Listing
		Images []db.ListingImage `json:"images"`
	}
	out := make([]listingWithImages, 0, len(listings))
	for _, l := range listings {
		imgs, _ := h.Queries.GetImagesByListing(context.Background(), l.ID)
		if imgs == nil {
			imgs = []db.ListingImage{}
		}
		out = append(out, listingWithImages{Listing: l, Images: imgs})
	}

	c.JSON(http.StatusOK, out)
}

type statusRequest struct {
	Status string `json:"status" binding:"required"`
}

func (h *Handler) SetStatus(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	existing, err := h.Queries.GetListingByID(context.Background(), pgUUID(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "listing not found"})
		return
	}

	userIDStr := c.GetString("userID")
	if existing.UserID.Bytes != mustParse(userIDStr) {
		c.JSON(http.StatusForbidden, gin.H{"error": "ikke din annonse"})
		return
	}

	var req statusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.Queries.UpdateListingStatus(context.Background(), db.UpdateListingStatusParams{
		ID:     pgUUID(id),
		Status: req.Status,
	}); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "status oppdatert"})
}

// sanitize strips single quotes to keep an inline string safe in SQL.
func sanitize(s string) string {
	out := make([]rune, 0, len(s))
	for _, r := range s {
		if r != '\'' {
			out = append(out, r)
		}
	}
	return string(out)
}
