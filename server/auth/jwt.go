package auth

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

// Claims is what a Wisp token carries. Admin status lives in the token so
// admin endpoints don't need a user lookup per request; the trade-off is that
// revoking admin only takes effect when the token expires (max 7 days).
type Claims struct {
	UserID  string
	IsAdmin bool
}

// GenerateToken creates a signed JWT for a given user.
func GenerateToken(userID string, isAdmin bool, secret string) (string, error) {
	claims := jwt.MapClaims{
		"user_id":  userID,
		"is_admin": isAdmin,
		"exp":      time.Now().Add(7 * 24 * time.Hour).Unix(), // expires in 7 days
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

// ParseToken verifies a token and returns the claims inside it. Only HS256 is
// accepted — pinning the algorithm prevents tokens signed any other way from
// slipping through.
func ParseToken(tokenStr, secret string) (Claims, error) {
	token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
		return []byte(secret), nil
	}, jwt.WithValidMethods([]string{"HS256"}))
	if err != nil {
		return Claims{}, err
	}
	if !token.Valid {
		return Claims{}, errors.New("invalid token")
	}

	mapClaims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return Claims{}, errors.New("unexpected claims type")
	}
	userID, ok := mapClaims["user_id"].(string)
	if !ok || userID == "" {
		return Claims{}, errors.New("token missing user_id")
	}
	isAdmin, _ := mapClaims["is_admin"].(bool) // absent in tokens issued before this claim existed

	return Claims{UserID: userID, IsAdmin: isAdmin}, nil
}
