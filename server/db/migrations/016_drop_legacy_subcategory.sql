-- The legacy `subcategory` column was superseded by `sub_category`.
-- Keeping both breaks pgx's RowToStructByName, which strips underscores
-- when matching columns to struct fields — so the two names collide.
ALTER TABLE listings DROP COLUMN subcategory;