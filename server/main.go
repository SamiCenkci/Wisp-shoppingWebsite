package main

import (
	"time"

	"github.com/SamiCenkci/Shopping-Website/auth"
	"github.com/SamiCenkci/Shopping-Website/chat"
	"github.com/SamiCenkci/Shopping-Website/config"
	"github.com/SamiCenkci/Shopping-Website/db"
	dbgen "github.com/SamiCenkci/Shopping-Website/db/generated"
	"github.com/SamiCenkci/Shopping-Website/email"
	"github.com/SamiCenkci/Shopping-Website/listing"
	"github.com/SamiCenkci/Shopping-Website/upload"
	"github.com/SamiCenkci/Shopping-Website/user"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	cfg := config.Load()
	pool := db.Connect(cfg.DatabaseURL)
	defer pool.Close()

	queries := dbgen.New(pool)

	mailer := &email.Sender{
		APIKey:  cfg.ResendAPIKey,
		SiteURL: "https://wispapp.net",
	}

	authHandler := &auth.Handler{
		Queries:   queries,
		JWTSecret: cfg.JWTSecret,
		Email:     mailer,
	}

	listingHandler := &listing.Handler{
		Queries:     queries,
		Pool:        pool,
		Email:       mailer,
		AlertSecret: cfg.AlertSecret,
	}

	uploadHandler := &upload.Handler{
		Region:    cfg.AWSRegion,
		AccessKey: cfg.AWSAccessKeyID,
		SecretKey: cfg.AWSSecretAccessKey,
		Bucket:    cfg.S3Bucket,
	}

	userHandler := &user.Handler{Queries: queries}

	chatHub := chat.NewHub()
	chatHandler := &chat.Handler{Queries: queries, Hub: chatHub}

	// Rate limiters: protect against brute-force logins and spam.
	loginLimiter := auth.NewLimiter(8, time.Minute)
	signupLimiter := auth.NewLimiter(5, time.Hour)
	listingLimiter := auth.NewLimiter(20, time.Hour)

	router := gin.Default()

	// Render terminates TLS at its proxy, so trust the forwarded client IP.
	_ = router.SetTrustedProxies([]string{"0.0.0.0/0"})

	router.Use(cors.New(cors.Config{
		AllowOrigins:     cfg.AllowedOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization", "X-Alert-Secret"},
		AllowCredentials: true,
	}))

	api := router.Group("/api")
	{
		api.GET("/health", func(c *gin.Context) {
			c.JSON(200, gin.H{"status": "ok"})
		})

		api.POST("/auth/signup", signupLimiter.Middleware(), authHandler.Register)
		api.POST("/auth/login", loginLimiter.Middleware(), authHandler.Login)
		api.GET("/auth/verify", authHandler.Verify)
		api.POST("/auth/resend-verification", auth.RequireAuth(cfg.JWTSecret), authHandler.ResendVerification)

		api.GET("/me", auth.RequireAuth(cfg.JWTSecret), func(c *gin.Context) {
			c.JSON(200, gin.H{"user_id": c.GetString("userID")})
		})

		api.GET("/listings", auth.OptionalAuth(cfg.JWTSecret), listingHandler.List)
		api.GET("/listings/mine", auth.RequireAuth(cfg.JWTSecret), listingHandler.Mine)
		api.POST("/listings/search", auth.OptionalAuth(cfg.JWTSecret), listingHandler.Search)
		api.GET("/listings/:id", auth.OptionalAuth(cfg.JWTSecret), listingHandler.GetOne)
		api.POST("/listings", listingLimiter.Middleware(), auth.RequireAuth(cfg.JWTSecret), auth.RequireVerified(queries), listingHandler.Create)
		api.PUT("/listings/:id", auth.RequireAuth(cfg.JWTSecret), listingHandler.Update)
		api.DELETE("/listings/:id", auth.RequireAuth(cfg.JWTSecret), listingHandler.Delete)
		api.PUT("/listings/:id/status", auth.RequireAuth(cfg.JWTSecret), listingHandler.SetStatus)

		api.POST("/uploads/presign", auth.RequireAuth(cfg.JWTSecret), uploadHandler.Presign)

		api.GET("/users/:id", userHandler.GetProfile)
		api.PUT("/users/me", auth.RequireAuth(cfg.JWTSecret), userHandler.UpdateMe)

		api.POST("/conversations", auth.RequireAuth(cfg.JWTSecret), auth.RequireVerified(queries), chatHandler.Start)
		api.GET("/conversations", auth.RequireAuth(cfg.JWTSecret), chatHandler.List)
		api.GET("/conversations/:id/messages", auth.RequireAuth(cfg.JWTSecret), chatHandler.Messages)
		api.GET("/messages/unread-count", auth.RequireAuth(cfg.JWTSecret), chatHandler.UnreadCount)
		api.POST("/conversations/:id/messages", auth.RequireAuth(cfg.JWTSecret), auth.RequireVerified(queries), chatHandler.Send)
		api.GET("/ws", auth.RequireAuthWS(cfg.JWTSecret), chatHandler.WebSocket)

		api.POST("/listings/:id/favorite", auth.RequireAuth(cfg.JWTSecret), listingHandler.AddFavorite)
		api.DELETE("/listings/:id/favorite", auth.RequireAuth(cfg.JWTSecret), listingHandler.RemoveFavorite)
		api.GET("/users/:id/favorites", auth.RequireAuth(cfg.JWTSecret), listingHandler.MyFavorites)

		api.PUT("/listings/:id/sold", auth.RequireAuth(cfg.JWTSecret), listingHandler.MarkSold)
		api.POST("/reviews", auth.RequireAuth(cfg.JWTSecret), listingHandler.CreateReview)
		api.GET("/users/:id/reviews", listingHandler.UserReviews)
		api.GET("/listings/:id/buyers", auth.RequireAuth(cfg.JWTSecret), listingHandler.ListingBuyers)

		api.DELETE("/reviews/:id", auth.RequireAuth(cfg.JWTSecret), listingHandler.DeleteReview)
		api.POST("/reviews/:id/reply", auth.RequireAuth(cfg.JWTSecret), listingHandler.ReplyToReview)
		api.GET("/reviews/given", auth.RequireAuth(cfg.JWTSecret), listingHandler.MyGivenReviews)
		api.GET("/listings/:id/can-review", auth.RequireAuth(cfg.JWTSecret), listingHandler.CanReview)

		api.POST("/saved-searches", auth.RequireAuth(cfg.JWTSecret), listingHandler.CreateSavedSearch)
		api.GET("/saved-searches", auth.RequireAuth(cfg.JWTSecret), listingHandler.ListSavedSearches)
		api.DELETE("/saved-searches/:id", auth.RequireAuth(cfg.JWTSecret), listingHandler.DeleteSavedSearch)

		// Triggered by an external scheduler, guarded by X-Alert-Secret.
		api.POST("/internal/run-alerts", listingHandler.RunAlerts)

		api.POST("/listings/:id/report", auth.RequireAuth(cfg.JWTSecret), listingHandler.ReportListing)

		api.GET("/admin/reports", auth.RequireAuth(cfg.JWTSecret), listingHandler.ListReports)
		api.PUT("/admin/reports/:id", auth.RequireAuth(cfg.JWTSecret), listingHandler.UpdateReportStatus)
		api.DELETE("/admin/listings/:id", auth.RequireAuth(cfg.JWTSecret), listingHandler.AdminDeleteListing)
	}

	router.Run(":" + cfg.Port)
}
