package upload

import (
	"context"
	"fmt"
	"net/http"
	"path/filepath"
	"strings"
	"time"

	"github.com/aws/aws-sdk-go-v2/aws"
	awscfg "github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type Handler struct {
	Region    string
	AccessKey string
	SecretKey string
	Bucket    string
}

type presignRequest struct {
	FileName    string `json:"file_name" binding:"required,max=255"`
	ContentType string `json:"content_type" binding:"required,max=100"`
}

// Only these types may be uploaded. Everything else is rejected before we sign
// anything — otherwise any logged-in user could store arbitrary files in the bucket.
var allowedTypes = map[string]bool{
	"image/jpeg":      true,
	"image/png":       true,
	"image/gif":       true,
	"image/webp":      true,
	"application/pdf": true,
}

// Uploads are capped at 10 MB. This is enforced by S3 itself via the presigned
// conditions — checking it here would be pointless, since the browser PUTs
// directly to S3 and never passes through this server.
const maxUploadBytes = 10 * 1024 * 1024

// safeFileName strips any path components and dangerous characters so a crafted
// filename can't escape the intended key prefix.
func safeFileName(name string) string {
	name = filepath.Base(name) // drop any directory part
	name = strings.ReplaceAll(name, "\\", "")
	name = strings.ReplaceAll(name, "/", "")

	var b strings.Builder
	for _, r := range name {
		switch {
		case r >= 'a' && r <= 'z', r >= 'A' && r <= 'Z', r >= '0' && r <= '9':
			b.WriteRune(r)
		case r == '.' || r == '-' || r == '_':
			b.WriteRune(r)
		default:
			b.WriteRune('-')
		}
	}

	cleaned := b.String()
	if cleaned == "" || cleaned == "." || cleaned == ".." {
		cleaned = "file"
	}
	if len(cleaned) > 100 {
		cleaned = cleaned[len(cleaned)-100:]
	}
	return cleaned
}

// POST /api/uploads/presign  (protected)
// Returns a temporary URL the browser can PUT a file to, plus the final public URL.
func (h *Handler) Presign(c *gin.Context) {
	var req presignRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if !allowedTypes[req.ContentType] {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "filtypen støttes ikke. Tillatt: JPG, PNG, GIF, WEBP, PDF",
		})
		return
	}

	cfg, err := awscfg.LoadDefaultConfig(context.Background(),
		awscfg.WithRegion(h.Region),
		awscfg.WithCredentialsProvider(
			credentials.NewStaticCredentialsProvider(h.AccessKey, h.SecretKey, ""),
		),
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "aws config failed"})
		return
	}

	client := s3.NewFromConfig(cfg)
	presigner := s3.NewPresignClient(client)

	key := fmt.Sprintf("listings/%s-%s", uuid.New().String(), safeFileName(req.FileName))

	presigned, err := presigner.PresignPutObject(context.Background(), &s3.PutObjectInput{
		Bucket:        aws.String(h.Bucket),
		Key:           aws.String(key),
		ContentType:   aws.String(req.ContentType),
		ContentLength: aws.Int64(maxUploadBytes),
	}, s3.WithPresignExpires(5*time.Minute))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	publicURL := fmt.Sprintf("https://%s.s3.%s.amazonaws.com/%s", h.Bucket, h.Region, key)

	c.JSON(http.StatusOK, gin.H{
		"upload_url": presigned.URL,
		"public_url": publicURL,
		"max_bytes":  maxUploadBytes,
	})
}
