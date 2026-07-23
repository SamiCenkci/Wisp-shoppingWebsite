package listing

import (
	"testing"

	"github.com/google/uuid"
)

func TestReviewTarget(t *testing.T) {
	seller := uuid.New()
	buyer := uuid.New()
	stranger := uuid.New()

	tests := []struct {
		name        string
		status      string
		soldToValid bool
		reviewer    uuid.UUID
		already     bool
		wantTarget  uuid.UUID
		wantErr     error
	}{
		{
			name:        "seller reviews buyer",
			status:      "sold",
			soldToValid: true,
			reviewer:    seller,
			wantTarget:  buyer,
		},
		{
			name:        "buyer reviews seller",
			status:      "sold",
			soldToValid: true,
			reviewer:    buyer,
			wantTarget:  seller,
		},
		{
			name:        "stranger cannot review",
			status:      "sold",
			soldToValid: true,
			reviewer:    stranger,
			wantErr:     ErrNotPartOfSale,
		},
		{
			name:        "cannot review an active listing",
			status:      "active",
			soldToValid: true,
			reviewer:    buyer,
			wantErr:     ErrSaleNotComplete,
		},
		{
			name:        "cannot review when no buyer was recorded",
			status:      "sold",
			soldToValid: false,
			reviewer:    buyer,
			wantErr:     ErrSaleNotComplete,
		},
		{
			name:        "cannot review twice",
			status:      "sold",
			soldToValid: true,
			reviewer:    buyer,
			already:     true,
			wantErr:     ErrAlreadyReviewed,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got, err := reviewTarget(tc.status, tc.soldToValid, seller, buyer, tc.reviewer, tc.already)

			if tc.wantErr != nil {
				if err != tc.wantErr {
					t.Fatalf("want error %v, got %v", tc.wantErr, err)
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if got != tc.wantTarget {
				t.Fatalf("want target %v, got %v", tc.wantTarget, got)
			}
		})
	}
}
