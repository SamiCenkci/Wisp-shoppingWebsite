package user

import (
	"context"
	"net/http"

	db "github.com/SamiCenkci/Shopping-Website/db/generated"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

type Handler struct {
	Queries *db.Queries
}

func pgUUID(id uuid.UUID) pgtype.UUID {
	return pgtype.UUID{Bytes: id, Valid: true}
}

func pgText(s string) pgtype.Text {
	return pgtype.Text{String: s, Valid: s != ""}
}

// GET /api/users/:id  (public profile + their active listings)
func (h *Handler) GetProfile(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	u, err := h.Queries.GetUserByID(context.Background(), pgUUID(id))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	listings, _ := h.Queries.ListActiveListingsByUser(context.Background(), u.ID)

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

	c.JSON(http.StatusOK, gin.H{
		"user": gin.H{
			"id":           u.ID,
			"name":         u.Name,
			"display_name": u.DisplayName,
			"avatar_url":   u.AvatarUrl.String,
			"bio":          u.Bio,
			"phone":        u.Phone,
			"city":         u.City,
			"created_at":   u.CreatedAt.Time,
		},
		"listings": out,
	})
}

type updateProfileRequest struct {
	Name          string `json:"name" binding:"required"`
	AvatarURL     string `json:"avatar_url"`
	DisplayName   string `json:"display_name"`
	Bio           string `json:"bio"`
	Phone         string `json:"phone"`
	BirthYear     string `json:"birth_year"`
	Gender        string `json:"gender"`
	StreetAddress string `json:"street_address"`
	PostalCode    string `json:"postal_code"`
	City          string `json:"city"`
	Country       string `json:"country"`
}

// PUT /api/users/me  (edit own profile)
func (h *Handler) UpdateMe(c *gin.Context) {
	userIDStr := c.GetString("userID")
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user"})
		return
	}

	var req updateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if len(req.Bio) > 500 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Beskrivelsen kan ikke overstige 500 tegn"})
		return
	}

	updated, err := h.Queries.UpdateProfile(context.Background(), db.UpdateProfileParams{
		ID:            pgUUID(userID),
		Name:          req.Name,
		AvatarUrl:     pgText(req.AvatarURL),
		DisplayName:   req.DisplayName,
		Bio:           req.Bio,
		Phone:         req.Phone,
		BirthYear:     req.BirthYear,
		Gender:        req.Gender,
		StreetAddress: req.StreetAddress,
		PostalCode:    req.PostalCode,
		City:          req.City,
		Country:       req.Country,
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":           updated.ID,
		"name":         updated.Name,
		"avatar_url":   updated.AvatarUrl.String,
		"display_name": updated.DisplayName,
	})
}
