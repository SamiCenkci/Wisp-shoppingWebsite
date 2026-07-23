package listing

import (
	"errors"

	"github.com/google/uuid"
)

var (
	ErrSaleNotComplete = errors.New("kan kun vurdere etter fullført salg")
	ErrNotPartOfSale   = errors.New("du var ikke del av dette salget")
	ErrAlreadyReviewed = errors.New("du har allerede vurdert dette salget")
)

// reviewTarget decides who a reviewer is allowed to review for a given sale.
//
// Rules:
//   - the listing must be sold, with a recorded buyer
//   - the reviewer must be either the seller or that buyer
//   - each party may review once per sale
//
// Returns the ID of the user being reviewed.
func reviewTarget(
	status string,
	soldToValid bool,
	sellerID, buyerID, reviewerID uuid.UUID,
	alreadyReviewed bool,
) (uuid.UUID, error) {
	if status != "sold" || !soldToValid {
		return uuid.Nil, ErrSaleNotComplete
	}

	var reviewed uuid.UUID
	switch reviewerID {
	case sellerID:
		reviewed = buyerID
	case buyerID:
		reviewed = sellerID
	default:
		return uuid.Nil, ErrNotPartOfSale
	}

	if alreadyReviewed {
		return uuid.Nil, ErrAlreadyReviewed
	}

	return reviewed, nil
}
