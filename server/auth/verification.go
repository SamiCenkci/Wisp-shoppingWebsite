package auth

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"

	db "github.com/SamiCenkci/Shopping-Website/db/generated"
)

const verificationValidFor = 24 * time.Hour

// newToken returns a cryptographically random URL-safe token.
func newToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

// IssueVerification creates a token and emails the link. Errors are logged
// rather than returned — a failed email shouldn't fail the signup itself.
func (h *Handler) IssueVerification(userID uuid.UUID, email, name string) {
	if h.Email == nil {
		log.Println("verification: mailer not configured")
		return
	}

	token, err := newToken()
	if err != nil {
		log.Printf("verification: token generation failed: %v", err)
		return
	}

	// Invalidate any earlier links for this user.
	_ = h.Queries.DeleteVerificationTokensForUser(context.Background(), pgUUID(userID))

	err = h.Queries.CreateVerificationToken(context.Background(), db.CreateVerificationTokenParams{
		Token:     token,
		UserID:    pgUUID(userID),
		ExpiresAt: pgtype.Timestamptz{Time: time.Now().Add(verificationValidFor), Valid: true},
	})
	if err != nil {
		log.Printf("verification: could not store token: %v", err)
		return
	}

	h.Email.SendVerificationEmail(email, name, token)
}

// GET /api/auth/verify?token=...
func (h *Handler) Verify(c *gin.Context) {
	token := c.Query("token")
	if token == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "mangler token"})
		return
	}

	row, err := h.Queries.GetVerificationToken(context.Background(), token)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ugyldig eller brukt lenke"})
		return
	}

	if time.Now().After(row.ExpiresAt.Time) {
		c.JSON(http.StatusBadRequest, gin.H{"error": "lenken har utløpt. Be om en ny."})
		return
	}

	if err := h.Queries.MarkUserVerified(context.Background(), row.UserID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// Single use.
	_ = h.Queries.DeleteVerificationTokensForUser(context.Background(), row.UserID)

	c.JSON(http.StatusOK, gin.H{"message": "e-postadressen er bekreftet"})
}

// POST /api/auth/resend-verification  (protected)
func (h *Handler) ResendVerification(c *gin.Context) {
	userID, err := uuid.Parse(c.GetString("userID"))
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user"})
		return
	}

	user, err := h.Queries.GetUserByID(context.Background(), pgUUID(userID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "bruker ikke funnet"})
		return
	}

	if user.VerifiedAt.Valid {
		c.JSON(http.StatusBadRequest, gin.H{"error": "e-postadressen er allerede bekreftet"})
		return
	}

	name := user.Name
	if user.DisplayName != "" {
		name = user.DisplayName
	}
	h.IssueVerification(userID, user.Email, name)

	c.JSON(http.StatusOK, gin.H{"message": "ny lenke sendt"})
}

// RequireVerified blocks actions that unverified accounts shouldn't perform.
func RequireVerified(queries *db.Queries) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID, err := uuid.Parse(c.GetString("userID"))
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid user"})
			c.Abort()
			return
		}

		user, err := queries.GetUserByID(context.Background(), pgUUID(userID))
		if err != nil || !user.VerifiedAt.Valid {
			c.JSON(http.StatusForbidden, gin.H{
				"error": "Bekreft e-postadressen din for å gjøre dette.",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}
