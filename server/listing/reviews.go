package listing

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	db "github.com/SamiCenkci/Shopping-Website/db/generated"
)

type soldRequest struct {
	BuyerID string `json:"buyer_id" binding:"required"`
}

// PUT /api/listings/:id/sold — mark sold and record which buyer bought it
func (h *Handler) MarkSold(c *gin.Context) {
	userID, err := uuid.Parse(c.GetString("userID"))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user"})
		return
	}
	listingID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	existing, err := h.Queries.GetListingByID(context.Background(), pgUUID(listingID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "listing not found"})
		return
	}
	if existing.UserID.Bytes != [16]byte(userID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "ikke din annonse"})
		return
	}

	var req soldRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	buyerID, err := uuid.Parse(req.BuyerID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ugyldig kjøper"})
		return
	}
	if buyerID == userID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "du kan ikke selge til deg selv"})
		return
	}

	if err := h.Queries.MarkListingSold(context.Background(), db.MarkListingSoldParams{
		ID:     pgUUID(listingID),
		SoldTo: pgUUID(buyerID),
	}); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "markert som solgt"})
}

type reviewRequest struct {
	ListingID     string `json:"listing_id" binding:"required"`
	Communication int32  `json:"communication" binding:"required,min=1,max=5"`
	Reliability   int32  `json:"reliability" binding:"required,min=1,max=5"`
	AsDescribed   int32  `json:"as_described" binding:"required,min=1,max=5"`
	Comment       string `json:"comment"`
}

// POST /api/reviews — leave a review for the other party in a completed sale
func (h *Handler) CreateReview(c *gin.Context) {
	reviewerID, err := uuid.Parse(c.GetString("userID"))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user"})
		return
	}

	var req reviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	listingID, err := uuid.Parse(req.ListingID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ugyldig annonse"})
		return
	}

	listing, err := h.Queries.GetListingByID(context.Background(), pgUUID(listingID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "annonse ikke funnet"})
		return
	}

	if listing.Status != "sold" || !listing.SoldTo.Valid {
		c.JSON(http.StatusBadRequest, gin.H{"error": "kan kun vurdere etter fullført salg"})
		return
	}

	sellerID := uuid.UUID(listing.UserID.Bytes)
	buyerID := uuid.UUID(listing.SoldTo.Bytes)

	var reviewedID uuid.UUID
	switch reviewerID {
	case sellerID:
		reviewedID = buyerID
	case buyerID:
		reviewedID = sellerID
	default:
		c.JSON(http.StatusForbidden, gin.H{"error": "du var ikke del av dette salget"})
		return
	}

	already, _ := h.Queries.HasReviewed(context.Background(), db.HasReviewedParams{
		ListingID:  pgUUID(listingID),
		ReviewerID: pgUUID(reviewerID),
	})
	if already {
		c.JSON(http.StatusBadRequest, gin.H{"error": "du har allerede vurdert dette salget"})
		return
	}

	review, err := h.Queries.CreateReview(context.Background(), db.CreateReviewParams{
		ListingID:      pgUUID(listingID),
		ReviewerID:     pgUUID(reviewerID),
		ReviewedUserID: pgUUID(reviewedID),
		Communication:  req.Communication,
		Reliability:    req.Reliability,
		AsDescribed:    req.AsDescribed,
		Comment:        req.Comment,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, review)
}

// GET /api/users/:id/reviews — a user's reviews plus their rating summary
func (h *Handler) UserReviews(c *gin.Context) {
	userID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	reviews, err := h.Queries.ListReviewsForUser(context.Background(), pgUUID(userID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if reviews == nil {
		reviews = []db.ListReviewsForUserRow{}
	}

	summary, err := h.Queries.GetUserRatingSummary(context.Background(), pgUUID(userID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"reviews":        reviews,
		"review_count":   summary.ReviewCount,
		"average_rating": summary.AverageRating,
	})
}

// GET /api/listings/:id/buyers — people who messaged about this listing (seller only)
func (h *Handler) ListingBuyers(c *gin.Context) {
	userID, err := uuid.Parse(c.GetString("userID"))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user"})
		return
	}
	listingID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	listing, err := h.Queries.GetListingByID(context.Background(), pgUUID(listingID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "annonse ikke funnet"})
		return
	}
	if listing.UserID.Bytes != [16]byte(userID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "ikke din annonse"})
		return
	}

	buyers, err := h.Queries.ListBuyersForListing(context.Background(), pgUUID(listingID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if buyers == nil {
		buyers = []db.ListBuyersForListingRow{}
	}

	c.JSON(http.StatusOK, buyers)
}