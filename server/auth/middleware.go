package auth

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

// RequireAuth is a gatekeeper. It checks for a valid JWT in the
// Authorization header. If valid, it lets the request through and
// attaches the user's ID. If not, it rejects with 401 Unauthorized.
func RequireAuth(jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		if header == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "missing authorization header"})
			c.Abort()
			return
		}

		parts := strings.SplitN(header, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid authorization format"})
			c.Abort()
			return
		}

		userID, err := ParseToken(parts[1], jwtSecret)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired token"})
			c.Abort()
			return
		}

		c.Set("userID", userID)
		c.Next()
	}
}

// RequireAuthWS is like RequireAuth but also accepts the token from a ?token= query param,
// since browsers can't set headers on WebSocket connections.
func RequireAuthWS(jwtSecret string) gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenStr := c.Query("token")

		// Fall back to the Authorization header if no query token
		if tokenStr == "" {
			header := c.GetHeader("Authorization")
			parts := strings.SplitN(header, " ", 2)
			if len(parts) == 2 && parts[0] == "Bearer" {
				tokenStr = parts[1]
			}
		}

		if tokenStr == "" {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "missing token"})
			c.Abort()
			return
		}

		userID, err := ParseToken(tokenStr, jwtSecret)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid or expired token"})
			c.Abort()
			return
		}

		c.Set("userID", userID)
		c.Next()
	}
}
