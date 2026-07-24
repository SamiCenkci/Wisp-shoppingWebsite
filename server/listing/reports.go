package listing

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"

	db "github.com/SamiCenkci/Shopping-Website/db/generated"
)

// Reasons the frontend offers. Anything else is rejected, so the moderation
// view can group by reason without dealing with free-text noise.
var validReasons = map[string]bool{
	"svindel":       true,
	"upassende":     true,
	"feil_kategori": true,
	"duplikat":      true,
	"solgt":         true,
	"annet":         true,
}

type reportRequest struct {
	Reason  string `json:"reason" binding:"required,max=30"`
	Details string `json:"details" binding:"max=1000"`
}

// POST /api/listings/:id/report
func (h *Handler) ReportListing(c *gin.Context) {
	reporterID, err := uuid.Parse(c.GetString("userID"))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user"})
		return
	}
	listingID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var req reportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if !validReasons[req.Reason] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ugyldig årsak"})
		return
	}

	listing, err := h.Queries.GetListingByID(context.Background(), pgUUID(listingID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "annonse ikke funnet"})
		return
	}

	// Reporting your own listing makes no sense and would just add noise.
	if listing.UserID.Bytes == [16]byte(reporterID) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "du kan ikke rapportere din egen annonse"})
		return
	}

	already, _ := h.Queries.HasReported(context.Background(), db.HasReportedParams{
		ListingID:  pgUUID(listingID),
		ReporterID: pgUUID(reporterID),
	})
	if already {
		c.JSON(http.StatusBadRequest, gin.H{"error": "du har allerede rapportert denne annonsen"})
		return
	}

	if _, err := h.Queries.CreateReport(context.Background(), db.CreateReportParams{
		ListingID:  pgUUID(listingID),
		ReporterID: pgUUID(reporterID),
		Reason:     req.Reason,
		Details:    req.Details,
	}); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "takk, rapporten er mottatt"})
}

// requireAdmin reports whether the caller is an admin, writing the error if not.
func (h *Handler) requireAdmin(c *gin.Context) bool {
	userID, err := uuid.Parse(c.GetString("userID"))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user"})
		return false
	}
	user, err := h.Queries.GetUserByID(context.Background(), pgUUID(userID))
	if err != nil || !user.IsAdmin {
		c.JSON(http.StatusForbidden, gin.H{"error": "ikke tilgang"})
		return false
	}
	return true
}

// GET /api/admin/reports
func (h *Handler) ListReports(c *gin.Context) {
	if !h.requireAdmin(c) {
		return
	}

	reports, err := h.Queries.ListReports(context.Background())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if reports == nil {
		reports = []db.ListReportsRow{}
	}

	open, _ := h.Queries.CountOpenReports(context.Background())

	c.JSON(http.StatusOK, gin.H{"reports": reports, "open_count": open})
}

type reportStatusRequest struct {
	Status string `json:"status" binding:"required"`
}

// PUT /api/admin/reports/:id
func (h *Handler) UpdateReportStatus(c *gin.Context) {
	if !h.requireAdmin(c) {
		return
	}

	reportID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var req reportStatusRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if req.Status != "reviewed" && req.Status != "dismissed" && req.Status != "open" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ugyldig status"})
		return
	}

	if err := h.Queries.UpdateReportStatus(context.Background(), db.UpdateReportStatusParams{
		ID:     pgUUID(reportID),
		Status: req.Status,
	}); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "status oppdatert"})
}

// DELETE /api/admin/listings/:id — remove a listing found to be in breach.
func (h *Handler) AdminDeleteListing(c *gin.Context) {
	if !h.requireAdmin(c) {
		return
	}

	listingID, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	// Soft delete, same as the owner's own delete — conversations and reviews survive.
	if err := h.Queries.DeleteListing(context.Background(), pgUUID(listingID)); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "annonsen er fjernet"})
}
