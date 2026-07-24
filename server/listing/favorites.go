package listing

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	db "github.com/SamiCenkci/Shopping-Website/db/generated"
)

// POST /api/listings/:id/favorite
func (h *Handler) AddFavorite(c *gin.Context) {
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

	err = h.Queries.AddFavorite(context.Background(), db.AddFavoriteParams{
		UserID:    pgUUID(userID),
		ListingID: pgUUID(listingID),
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"liked": true})
}

// DELETE /api/listings/:id/favorite
func (h *Handler) RemoveFavorite(c *gin.Context) {
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

	err = h.Queries.RemoveFavorite(context.Background(), db.RemoveFavoriteParams{
		UserID:    pgUUID(userID),
		ListingID: pgUUID(listingID),
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"liked": false})
}

// GET /api/users/:id/favorites  (private — only the owner can see their own)
func (h *Handler) MyFavorites(c *gin.Context) {
	authID, err := uuid.Parse(c.GetString("userID"))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user"})
		return
	}
	profileID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	// Private: you can only see your own liked listings
	if authID != profileID {
		c.JSON(http.StatusForbidden, gin.H{"error": "ikke tilgang"})
		return
	}

	listings, err := h.Queries.ListFavoriteListingsByUser(context.Background(), pgUUID(authID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Everything here is favorited by definition, so pass a nil liked set.
	c.JSON(http.StatusOK, attach(listings, h.imagesFor(listings), nil))
}
