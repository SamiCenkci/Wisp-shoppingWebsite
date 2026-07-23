package listing

import (
	"fmt"
	"regexp"
	"strconv"
	"strings"
	"testing"
)

// placeholderNumbers returns every $N found in the query, in order.
func placeholderNumbers(sql string) []int {
	re := regexp.MustCompile(`\$(\d+)`)
	matches := re.FindAllStringSubmatch(sql, -1)
	nums := make([]int, 0, len(matches))
	for _, m := range matches {
		n, _ := strconv.Atoi(m[1])
		nums = append(nums, n)
	}
	return nums
}

// highestPlaceholder reports the largest $N in the query.
func highestPlaceholder(sql string) int {
	max := 0
	for _, n := range placeholderNumbers(sql) {
		if n > max {
			max = n
		}
	}
	return max
}

func TestEmptySearchAddsNoFilters(t *testing.T) {
	sql, args := buildSearchQuery(searchRequest{})

	if len(args) != 0 {
		t.Fatalf("expected no arguments, got %d: %v", len(args), args)
	}
	if strings.Count(sql, "$") != 0 {
		t.Fatal("expected no placeholders in an unfiltered query")
	}
	if !strings.Contains(sql, "deleted_at IS NULL") {
		t.Fatal("deleted listings must always be excluded")
	}
	if !strings.Contains(sql, "ORDER BY created_at DESC") {
		t.Fatal("expected default sort by newest")
	}
}

// The most likely bug in this code is argument numbering drifting out of sync
// with the args slice when several filters combine.
func TestPlaceholdersMatchArgumentCount(t *testing.T) {
	tests := []struct {
		name string
		req  searchRequest
	}{
		{"query only", searchRequest{Query: "sykkel"}},
		{"category only", searchRequest{Category: "Elektronikk og hvitevarer"}},
		{"place only", searchRequest{Place: "Oslo"}},
		{"price range", searchRequest{MinPrice: 10000, MaxPrice: 50000}},
		{
			"full category path",
			searchRequest{
				Category:        "Elektronikk og hvitevarer",
				SubCategory:     "Spill og konsoll",
				ProductCategory: "Spill",
			},
		},
		{
			"attributes",
			searchRequest{Attributes: map[string]string{"plattform": "PlayStation 5"}},
		},
		{
			"everything at once",
			searchRequest{
				Query:           "gitar",
				Category:        "Fritid, hobby og underholdning",
				SubCategory:     "Musikkinstrumenter",
				ProductCategory: "Gitar",
				Attributes:      map[string]string{"merke": "Fender", "farge": "Svart"},
				Place:           "0150",
				Condition:       "good",
				AdType:          "sale",
				MinPrice:        50000,
				MaxPrice:        900000,
				SortBy:          "price_asc",
			},
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			sql, args := buildSearchQuery(tc.req)

			if got := highestPlaceholder(sql); got != len(args) {
				t.Fatalf("highest placeholder $%d but %d arguments supplied\nSQL: %s", got, len(args), sql)
			}

			// Every placeholder from $1 to $len(args) must be used at least once,
			// otherwise Postgres rejects the query.
			seen := map[int]bool{}
			for _, n := range placeholderNumbers(sql) {
				seen[n] = true
			}
			for i := 1; i <= len(args); i++ {
				if !seen[i] {
					t.Fatalf("argument $%d is never referenced\nSQL: %s", i, sql)
				}
			}
		})
	}
}

func TestQuerySearchUsesFuzzyMatching(t *testing.T) {
	sql, args := buildSearchQuery(searchRequest{Query: "sykkel"})

	if !strings.Contains(sql, "similarity(title") {
		t.Fatal("expected trigram similarity matching for text search")
	}
	if len(args) != 3 {
		// two for the ILIKE/similarity filter, one for the ORDER BY
		t.Fatalf("expected 3 arguments, got %d: %v", len(args), args)
	}
	if args[0] != "%sykkel%" {
		t.Fatalf("expected wildcard-wrapped term first, got %v", args[0])
	}
}

func TestPlaceMatchesPostalCodeOrName(t *testing.T) {
	sql, args := buildSearchQuery(searchRequest{Place: "Oslo"})

	if len(args) != 1 {
		t.Fatalf("place should use a single reused argument, got %d", len(args))
	}
	for _, col := range []string{"postal_code", "municipality", "county"} {
		if !strings.Contains(sql, col) {
			t.Fatalf("place filter should check %s", col)
		}
	}
}

func TestEmptyAttributeValuesAreSkipped(t *testing.T) {
	// The frontend sends "" for unselected dropdowns; those must not filter.
	sql, args := buildSearchQuery(searchRequest{
		Attributes: map[string]string{"plattform": "", "merke": "Apple"},
	})

	if len(args) != 2 {
		t.Fatalf("expected only the non-empty attribute, got %d args: %v", len(args), args)
	}
	if strings.Count(sql, "attributes->>") != 1 {
		t.Fatal("expected exactly one attribute clause")
	}
}

func TestZeroPricesAreNotFilters(t *testing.T) {
	// 0 means "unset" from the frontend, not "free".
	_, args := buildSearchQuery(searchRequest{MinPrice: 0, MaxPrice: 0})
	if len(args) != 0 {
		t.Fatalf("zero prices should add no filters, got %v", args)
	}
}

func TestSortOptions(t *testing.T) {
	cases := map[string]string{
		"price_asc":  "ORDER BY price_ore ASC",
		"price_desc": "ORDER BY price_ore DESC",
		"newest":     "ORDER BY created_at DESC",
		"":           "ORDER BY created_at DESC",
	}

	for sortBy, want := range cases {
		sql, _ := buildSearchQuery(searchRequest{SortBy: sortBy})
		if !strings.Contains(sql, want) {
			t.Fatalf("sort %q: expected %q\nSQL: %s", sortBy, want, sql)
		}
	}
}

func TestAttributeKeysAreParameterised(t *testing.T) {
	// Keys come from the client, so they must never be concatenated into SQL.
	evil := "x' OR '1'='1"
	sql, args := buildSearchQuery(searchRequest{
		Attributes: map[string]string{evil: "value"},
	})

	if strings.Contains(sql, evil) {
		t.Fatalf("attribute key was interpolated into SQL: %s", sql)
	}
	if fmt.Sprint(args[0]) != evil {
		t.Fatalf("expected the key to be passed as an argument, got %v", args[0])
	}
}
