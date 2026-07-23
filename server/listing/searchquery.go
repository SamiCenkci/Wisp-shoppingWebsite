package listing

import (
	"strconv"
)

// buildSearchQuery turns a search request into SQL plus its arguments.
//
// It's separated from the handler so the filter logic can be tested without a
// database — argument numbering in particular is easy to get subtly wrong.
func buildSearchQuery(req searchRequest) (string, []interface{}) {
	sql := "SELECT * FROM listings WHERE status = 'active' AND deleted_at IS NULL AND created_at > NOW() - INTERVAL '60 days'"
	args := []interface{}{}
	argN := 1

	if req.Query != "" {
		p := strconv.Itoa(argN)
		sql += " AND (title ILIKE $" + p +
			" OR description ILIKE $" + p +
			" OR similarity(title, $" + strconv.Itoa(argN+1) + ") > 0.2)"
		args = append(args, "%"+req.Query+"%")
		args = append(args, req.Query)
		argN += 2
	}

	if req.Category != "" {
		sql += " AND category = $" + strconv.Itoa(argN)
		args = append(args, req.Category)
		argN++
	}

	if req.SubCategory != "" {
		sql += " AND sub_category = $" + strconv.Itoa(argN)
		args = append(args, req.SubCategory)
		argN++
	}

	if req.ProductCategory != "" {
		sql += " AND product_category = $" + strconv.Itoa(argN)
		args = append(args, req.ProductCategory)
		argN++
	}

	// Attribute keys are parameterised, so a crafted key can't inject SQL.
	for key, val := range req.Attributes {
		if val == "" {
			continue
		}
		sql += " AND attributes->>$" + strconv.Itoa(argN) + " = $" + strconv.Itoa(argN+1)
		args = append(args, key, val)
		argN += 2
	}

	if req.Place != "" {
		p := strconv.Itoa(argN)
		sql += " AND (postal_code = $" + p +
			" OR municipality ILIKE '%' || $" + p + " || '%'" +
			" OR county ILIKE '%' || $" + p + " || '%')"
		args = append(args, req.Place)
		argN++
	}

	if req.Condition != "" {
		sql += " AND condition = $" + strconv.Itoa(argN)
		args = append(args, req.Condition)
		argN++
	}

	if req.AdType != "" {
		sql += " AND ad_type = $" + strconv.Itoa(argN)
		args = append(args, req.AdType)
		argN++
	}

	if req.MinPrice > 0 {
		sql += " AND price_ore >= $" + strconv.Itoa(argN)
		args = append(args, req.MinPrice)
		argN++
	}

	if req.MaxPrice > 0 {
		sql += " AND price_ore <= $" + strconv.Itoa(argN)
		args = append(args, req.MaxPrice)
		argN++
	}

	// Only used by the saved-search alert runner, to find listings posted
	// since that search was last checked.
	if req.CreatedSince != nil {
		sql += " AND created_at > $" + strconv.Itoa(argN)
		args = append(args, *req.CreatedSince)
		argN++
	}

	switch req.SortBy {
	case "price_asc":
		sql += " ORDER BY price_ore ASC"
	case "price_desc":
		sql += " ORDER BY price_ore DESC"
	default:
		if req.Query != "" {
			sql += " ORDER BY similarity(title, $" + strconv.Itoa(argN) + ") DESC, created_at DESC"
			args = append(args, req.Query)
			argN++
		} else {
			sql += " ORDER BY created_at DESC"
		}
	}

	sql += " LIMIT 50"
	return sql, args
}
