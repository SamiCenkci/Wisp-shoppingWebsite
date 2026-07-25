package auth

import "testing"

func TestTokenRoundTrip(t *testing.T) {
	secret := "test-secret"

	for _, isAdmin := range []bool{true, false} {
		token, err := GenerateToken("user-123", isAdmin, secret)
		if err != nil {
			t.Fatalf("GenerateToken: %v", err)
		}

		claims, err := ParseToken(token, secret)
		if err != nil {
			t.Fatalf("ParseToken: %v", err)
		}
		if claims.UserID != "user-123" {
			t.Errorf("UserID = %q, want %q", claims.UserID, "user-123")
		}
		if claims.IsAdmin != isAdmin {
			t.Errorf("IsAdmin = %v, want %v", claims.IsAdmin, isAdmin)
		}
	}
}

func TestParseTokenRejectsWrongSecret(t *testing.T) {
	token, err := GenerateToken("user-123", false, "right-secret")
	if err != nil {
		t.Fatalf("GenerateToken: %v", err)
	}
	if _, err := ParseToken(token, "wrong-secret"); err == nil {
		t.Error("expected error for token signed with a different secret")
	}
}

func TestParseTokenRejectsGarbage(t *testing.T) {
	if _, err := ParseToken("not-a-token", "secret"); err == nil {
		t.Error("expected error for malformed token")
	}
}
