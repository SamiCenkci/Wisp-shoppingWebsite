package main

import (
    "net/http"
    "github.com/gin-gonic/gin"
)

func main() {
    // Create a new Gin router (this is your server)
    router := gin.Default()

    // Define one route: GET /api/health
    // When someone visits this URL, send back "Server is running!"
    router.GET("/api/health", func(c *gin.Context) {
        c.JSON(http.StatusOK, gin.H{
            "status":  "ok",
            "message": "Server is running!",
        })
    })

    // Start the server on port 8080
    router.Run(":8080")
}