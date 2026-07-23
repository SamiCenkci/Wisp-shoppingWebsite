package listing

import (
	"context"
	"encoding/json"
	"net/http"
	"strconv"

	db "github.com/SamiCenkci/Shopping-Website/db/generated"
	"github.com/SamiCenkci/Shopping-Website/email"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Handler struct {
	Queries *db.Queries
	Pool    *pgxpool.Pool
	Email   *email.Sender
}

type createRequest struct {
	Title           string            `json:"title" binding:"required"`
	Description     string            `json:"description" binding:"required"`
	PriceOre        int32             `json:"price_ore" binding:"required,min=0"`
	Category        string            `json:"category" binding:"required"`
	Subcategory     string            `json:"subcategory"`
	Condition       string            `json:"condition" binding:"required"`
	County          string            `json:"county" binding:"required"`
	Municipality    string            `json:"municipality" binding:"required"`
	AdType          string            `json:"ad_type"`
	StreetAddress   string            `json:"street_address"`
	Latitude        float64           `json:"latitude"`
	Longitude       float64           `json:"longitude"`
	PostalCode      string            `json:"postal_code"`
	SubCategory     string            `json:"sub_category"`
	ProductCategory string            `json:"product_category"`
	Attributes      map[string]string `json:"attributes"`
	Images          []string          `json:"images"`
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
		UserID:          pgUUID(userID),
		Title:           req.Title,
		Description:     req.Description,
		PriceOre:        req.PriceOre,
		Category:        req.Category,
		Subcategory:     pgText(req.Subcategory),
		Condition:       req.Condition,
		County:          req.County,
		Municipality:    req.Municipality,
		AdType:          adType,
		StreetAddress:   req.StreetAddress,
		Latitude:        pgFloat8(req.Latitude),
		Longitude:       pgFloat8(req.Longitude),
		SubCategory:     req.SubCategory,
		ProductCategory: req.ProductCategory,
		Attributes:      attrsJSON(req.Attributes),
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

	liked := h.likedSet(c)

	type listingWithImages struct {
		db.Listing
		Images    []db.ListingImage `json:"images"`
		LikedByMe bool              `json:"liked_by_me"`
	}
	result := make([]listingWithImages, 0, len(listings))
	for _, l := range listings {
		imgs, _ := h.Queries.GetImagesByListing(context.Background(), l.ID)
		if imgs == nil {
			imgs = []db.ListingImage{}
		}
		result = append(result, listingWithImages{
			Listing:   l,
			Images:    imgs,
			LikedByMe: liked[uuid.UUID(l.ID.Bytes).String()],
		})
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

	// Count this view (fire-and-forget; don't block on errors)
	_ = h.Queries.IncrementViewCount(context.Background(), listing.ID)
	listing.ViewCount = listing.ViewCount + 1

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

	likeCount, _ := h.Queries.CountFavorites(context.Background(), listing.ID)

	likedByMe := false
	if uidStr := c.GetString("userID"); uidStr != "" {
		if uid, err := uuid.Parse(uidStr); err == nil {
			likedByMe, _ = h.Queries.IsFavorited(context.Background(), db.IsFavoritedParams{
				UserID:    pgUUID(uid),
				ListingID: listing.ID,
			})
		}
	}

	attrs := listing.Attributes
	if len(attrs) == 0 {
		attrs = []byte("{}")
	}

	c.JSON(http.StatusOK, gin.H{
		"listing":     listing,
		"images":      images,
		"similar":     similarOut,
		"like_count":  likeCount,
		"liked_by_me": likedByMe,
		"attributes":  json.RawMessage(attrs),
		"seller": gin.H{
			"id":           seller.ID,
			"name":         seller.Name,
			"display_name": seller.DisplayName,
			"avatar_url":   seller.AvatarUrl.String,
			"created_at":   seller.CreatedAt.Time,
		},
	})

	c.JSON(http.StatusOK, gin.H{
		"listing":     listing,
		"images":      images,
		"similar":     similarOut,
		"like_count":  likeCount,
		"liked_by_me": likedByMe,
		"attributes":  json.RawMessage(listing.Attributes),
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
		ID:              pgUUID(id),
		Title:           req.Title,
		Description:     req.Description,
		PriceOre:        req.PriceOre,
		Category:        req.Category,
		Subcategory:     pgText(req.Subcategory),
		Condition:       req.Condition,
		County:          req.County,
		Municipality:    req.Municipality,
		StreetAddress:   req.StreetAddress,
		Latitude:        pgFloat8(req.Latitude),
		Longitude:       pgFloat8(req.Longitude),
		SubCategory:     req.SubCategory,
		ProductCategory: req.ProductCategory,
		Attributes:      attrsJSON(req.Attributes),
		PostalCode:      req.PostalCode,
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
	Query           string            `json:"query"`
	Category        string            `json:"category"`
	SubCategory     string            `json:"sub_category"`
	ProductCategory string            `json:"product_category"`
	Attributes      map[string]string `json:"attributes"`
	Condition       string            `json:"condition"`
	AdType          string            `json:"ad_type"`
	MinPrice        int32             `json:"min_price"`
	MaxPrice        int32             `json:"max_price"`
	SortBy          string            `json:"sort_by"`
	Place           string            `json:"place"`
}

func (h *Handler) Search(c *gin.Context) {
	var req searchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	sql := "SELECT * FROM listings WHERE status = 'active' AND deleted_at IS NULL AND created_at > NOW() - INTERVAL '60 days'"
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

	if req.SubCategory != "" {
		sql += " AND sub_category = $" + strconv.Itoa(argN)
		args = append(args, req.SubCategory)
		argN++
	}

	if req.ProductCategory != "" {
		sql += " AND product_category = $" + strconv.Itoa(argN)
		args = append(args, req.ProductCategory)
		argN++
	}

	for key, val := range req.Attributes {
		if val == "" {
			continue
		}
		sql += " AND attributes->>$" + strconv.Itoa(argN) + " = $" + strconv.Itoa(argN+1)
		args = append(args, key, val)
		argN += 2
	}

	if req.Place != "" {
		p := strconv.Itoa(argN)
		sql += " AND (postal_code = $" + p +
			" OR municipality ILIKE '%' || $" + p + " || '%'" +
			" OR county ILIKE '%' || $" + p + " || '%')"
		args = append(args, req.Place)
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

	liked := h.likedSet(c)

	type listingWithImages struct {
		db.Listing
		Images    []db.ListingImage `json:"images"`
		LikedByMe bool              `json:"liked_by_me"`
	}
	out := make([]listingWithImages, 0, len(results))
	for _, l := range results {
		imgs, _ := h.Queries.GetImagesByListing(context.Background(), l.ID)
		if imgs == nil {
			imgs = []db.ListingImage{}
		}
		out = append(out, listingWithImages{
			Listing:   l,
			Images:    imgs,
			LikedByMe: liked[uuid.UUID(l.ID.Bytes).String()],
		})
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

// pgFloat8 wraps a float64, treating 0 as "not set".
func pgFloat8(f float64) pgtype.Float8 {
	if f == 0 {
		return pgtype.Float8{Valid: false}
	}
	return pgtype.Float8{Float64: f, Valid: true}
}

// attrsJSON encodes the attribute map for the JSONB column.
func attrsJSON(m map[string]string) []byte {
	if m == nil {
		m = map[string]string{}
	}
	b, err := json.Marshal(m)
	if err != nil {
		return []byte("{}")
	}
	return b
}

// likedSet returns the set of listing IDs the given user has favorited.
// Returns an empty set if userID is empty (logged out).
func (h *Handler) likedSet(c *gin.Context) map[string]bool {
	set := map[string]bool{}
	uidStr := c.GetString("userID")
	if uidStr == "" {
		return set
	}
	uid, err := uuid.Parse(uidStr)
	if err != nil {
		return set
	}
	ids, err := h.Queries.ListFavoriteIDsByUser(context.Background(), pgUUID(uid))
	if err != nil {
		return set
	}
	for _, id := range ids {
		set[uuid.UUID(id.Bytes).String()] = true
	}
	return set
}
