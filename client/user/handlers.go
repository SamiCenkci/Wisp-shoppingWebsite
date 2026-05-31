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