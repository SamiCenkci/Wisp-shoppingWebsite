package config

import (
	"log"
	"os"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	Port               string
	DatabaseURL        string
	JWTSecret          string
	AWSRegion          string
	AWSAccessKeyID     string
	AWSSecretAccessKey string
	S3Bucket           string
	AllowedOrigins     []string
	ResendAPIKey       string
	AlertSecret        string
}

func Load() *Config {
	_ = godotenv.Load()

	origins := os.Getenv("ALLOWED_ORIGINS")
	if origins == "" {
		origins = "http://localhost:3000"
	}

	var originList []string
	for _, o := range strings.Split(origins, ",") {
		o = strings.TrimSpace(o)
		o = strings.Trim(o, "\"'") // strip stray quotes
		if o == "" {
			continue
		}
		if !strings.HasPrefix(o, "http://") && !strings.HasPrefix(o, "https://") {
			log.Printf("WARNING: skipping invalid origin %q (must start with http:// or https://)", o)
			continue
		}
		originList = append(originList, o)
	}
	if len(originList) == 0 {
		originList = []string{"http://localhost:3000"}
	}

	cfg := &Config{
		Port:               os.Getenv("PORT"),
		DatabaseURL:        os.Getenv("DATABASE_URL"),
		JWTSecret:          os.Getenv("JWT_SECRET"),
		AWSRegion:          os.Getenv("AWS_REGION"),
		AWSAccessKeyID:     os.Getenv("AWS_ACCESS_KEY_ID"),
		AWSSecretAccessKey: os.Getenv("AWS_SECRET_ACCESS_KEY"),
		S3Bucket:           os.Getenv("S3_BUCKET"),
		AllowedOrigins:     originList,
		ResendAPIKey:       os.Getenv("RESEND_API_KEY"),
		AlertSecret:        os.Getenv("ALERT_SECRET"),
	}
	if cfg.DatabaseURL == "" {
		log.Fatal("DATABASE_URL is not set in .env")
	}
	return cfg
}
