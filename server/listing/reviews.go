package listing

import (
	"context"
	"log"
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

	// Email the buyer asking for a review (non-blocking)
	if h.Email == nil {
		log.Println("email: mailer not configured")
	} else {
		buyer, err := h.Queries.GetUserByID(context.Background(), pgUUID(buyerID))
		if err != nil {
			log.Printf("email: could not load buyer: %v", err)
		} else {
			seller, _ := h.Queries.GetUserByID(context.Background(), existing.UserID)
			sellerName := seller.Name
			if seller.DisplayName != "" {
				sellerName = seller.DisplayName
			}
			buyerName := buyer.Name
			if buyer.DisplayName != "" {
				buyerName = buyer.DisplayName
			}
			log.Printf("email: sending review request to %s", buyer.Email)
			h.Email.SendReviewRequest(buyer.Email, buyerName, existing.Title, sellerName, listingID.String())
		}
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

	already, _ := h.Queries.HasReviewed(context.Background(), db.HasReviewedParams{
		ListingID:  pgUUID(listingID),
		ReviewerID: pgUUID(reviewerID),
	})

	reviewedID, err := reviewTarget(
		listing.Status,
		listing.SoldTo.Valid,
		uuid.UUID(listing.UserID.Bytes),
		uuid.UUID(listing.SoldTo.Bytes),
		reviewerID,
		already,
	)
	if err != nil {
		status := http.StatusBadRequest
		if err == ErrNotPartOfSale {
			status = http.StatusForbidden
		}
		c.JSON(status, gin.H{"error": err.Error()})
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

// DELETE /api/reviews/:id — delete a review you wrote
func (h *Handler) DeleteReview(c *gin.Context) {
	userID, err := uuid.Parse(c.GetString("userID"))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user"})
		return
	}
	reviewID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	// The query itself only deletes when reviewer_id matches, so this is safe.
	if err := h.Queries.DeleteReview(context.Background(), db.DeleteReviewParams{
		ID:         pgUUID(reviewID),
		ReviewerID: pgUUID(userID),
	}); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "vurdering slettet"})
}

type replyRequest struct {
	Reply string `json:"reply" binding:"required"`
}

// POST /api/reviews/:id/reply — reply to a review written about you
func (h *Handler) ReplyToReview(c *gin.Context) {
	userID, err := uuid.Parse(c.GetString("userID"))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user"})
		return
	}
	reviewID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var req replyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	review, err := h.Queries.GetReviewByID(context.Background(), pgUUID(reviewID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "vurdering ikke funnet"})
		return
	}
	if review.ReviewedUserID.Bytes != [16]byte(userID) {
		c.JSON(http.StatusForbidden, gin.H{"error": "du kan kun svare på vurderinger om deg"})
		return
	}
	if review.Reply != "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "du har allerede svart"})
		return
	}

	if err := h.Queries.ReplyToReview(context.Background(), db.ReplyToReviewParams{
		ID:             pgUUID(reviewID),
		ReviewedUserID: pgUUID(userID),
		Reply:          req.Reply,
	}); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "svar lagret"})
}

// GET /api/reviews/given — reviews the logged-in user has written
func (h *Handler) MyGivenReviews(c *gin.Context) {
	userID, err := uuid.Parse(c.GetString("userID"))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user"})
		return
	}

	reviews, err := h.Queries.ListReviewsByReviewer(context.Background(), pgUUID(userID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if reviews == nil {
		reviews = []db.ListReviewsByReviewerRow{}
	}

	c.JSON(http.StatusOK, reviews)
}

// GET /api/listings/:id/can-review — whether the current user may review this sale
func (h *Handler) CanReview(c *gin.Context) {
	userID, err := uuid.Parse(c.GetString("userID"))
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"can_review": false})
		return
	}
	listingID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"can_review": false})
		return
	}

	listing, err := h.Queries.GetListingByID(context.Background(), pgUUID(listingID))
	if err != nil || listing.Status != "sold" || !listing.SoldTo.Valid {
		c.JSON(http.StatusOK, gin.H{"can_review": false})
		return
	}

	sellerID := uuid.UUID(listing.UserID.Bytes)
	buyerID := uuid.UUID(listing.SoldTo.Bytes)
	if userID != sellerID && userID != buyerID {
		c.JSON(http.StatusOK, gin.H{"can_review": false})
		return
	}

	already, _ := h.Queries.HasReviewed(context.Background(), db.HasReviewedParams{
		ListingID:  pgUUID(listingID),
		ReviewerID: pgUUID(userID),
	})

	c.JSON(http.StatusOK, gin.H{"can_review": !already})
}
