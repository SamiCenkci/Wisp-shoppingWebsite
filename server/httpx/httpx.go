// Package httpx holds small helpers shared by the HTTP handlers.
package httpx

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

// ServerError logs the underlying error together with the request that caused
// it, and returns a generic message. Internal details (SQL, table names,
// driver errors) belong in the server log, not in the response body.
func ServerError(c *gin.Context, err error) {
	log.Printf("%s %s: %v", c.Request.Method, c.Request.URL.Path, err)
	c.JSON(http.StatusInternalServerError, gin.H{"error": "noe gikk galt, prøv igjen senere"})
}
