-- Point the demo listings at images uploaded to S3.
--
-- Before running this:
--   1. Rename your downloaded files to match the names below
--   2. Upload them all to the `listings/` folder in the
--      samicenkci-marketplace-images bucket
--   3. Test one URL in a browser — a 403 means the bucket policy
--      isn't covering them
--
-- The deleted_at filter matters: soft-deleted duplicates from the first
-- seed run are still in the table, and without it the subquery returns
-- more than one row.
--
-- Run with:
--   psql "$NEON" -f db/seed/demo_images.sql
 
SET client_encoding = 'UTF8';
 
UPDATE listing_images
SET url = 'https://samicenkci-marketplace-images.s3.eu-north-1.amazonaws.com/listings/macbook.webp'
WHERE listing_id = (SELECT id FROM listings WHERE title = 'MacBook Air M2 13" 256GB' AND deleted_at IS NULL);
 
UPDATE listing_images
SET url = 'https://samicenkci-marketplace-images.s3.eu-north-1.amazonaws.com/listings/ps5.webp'
WHERE listing_id = (SELECT id FROM listings WHERE title = 'PlayStation 5 med to kontroller' AND deleted_at IS NULL);
 
UPDATE listing_images
SET url = 'https://samicenkci-marketplace-images.s3.eu-north-1.amazonaws.com/listings/elden-ring.avif'
WHERE listing_id = (SELECT id FROM listings WHERE title = 'Elden Ring til PS5' AND deleted_at IS NULL);
 
UPDATE listing_images
SET url = 'https://samicenkci-marketplace-images.s3.eu-north-1.amazonaws.com/listings/iphone.jpeg'
WHERE listing_id = (SELECT id FROM listings WHERE title = 'iPhone 13 128GB, blå' AND deleted_at IS NULL);
 
UPDATE listing_images
SET url = 'https://samicenkci-marketplace-images.s3.eu-north-1.amazonaws.com/listings/sofa.jpg'
WHERE listing_id = (SELECT id FROM listings WHERE title = 'IKEA Ektorp 3-seter sofa' AND deleted_at IS NULL);
 
UPDATE listing_images
SET url = 'https://samicenkci-marketplace-images.s3.eu-north-1.amazonaws.com/listings/dining-table.webp'
WHERE listing_id = (SELECT id FROM listings WHERE title = 'Spisebord i eik, 180 cm' AND deleted_at IS NULL);
 
UPDATE listing_images
SET url = 'https://samicenkci-marketplace-images.s3.eu-north-1.amazonaws.com/listings/desk.jpeg'
WHERE listing_id = (SELECT id FROM listings WHERE title = 'Skrivebord med hev/senk' AND deleted_at IS NULL);
 
UPDATE listing_images
SET url = 'https://samicenkci-marketplace-images.s3.eu-north-1.amazonaws.com/listings/bike.avif'
WHERE listing_id = (SELECT id FROM listings WHERE title = 'Trek Marlin 7 terrengsykkel' AND deleted_at IS NULL);
 
UPDATE listing_images
SET url = 'https://samicenkci-marketplace-images.s3.eu-north-1.amazonaws.com/listings/jacket.avif'
WHERE listing_id = (SELECT id FROM listings WHERE title = 'Bergans turjakke, str L' AND deleted_at IS NULL);
 
UPDATE listing_images
SET url = 'https://samicenkci-marketplace-images.s3.eu-north-1.amazonaws.com/listings/skis.avif'
WHERE listing_id = (SELECT id FROM listings WHERE title = 'Alpinski Atomic 170 cm med binding' AND deleted_at IS NULL);
 
UPDATE listing_images
SET url = 'https://samicenkci-marketplace-images.s3.eu-north-1.amazonaws.com/listings/guitar.webp'
WHERE listing_id = (SELECT id FROM listings WHERE title = 'Fender Stratocaster, mexicansk' AND deleted_at IS NULL);
 
UPDATE listing_images
SET url = 'https://samicenkci-marketplace-images.s3.eu-north-1.amazonaws.com/listings/drill.png'
WHERE listing_id = (SELECT id FROM listings WHERE title = 'Bosch slagbormaskin 18V' AND deleted_at IS NULL);
 
UPDATE listing_images
SET url = 'https://samicenkci-marketplace-images.s3.eu-north-1.amazonaws.com/listings/highchair.webp'
WHERE listing_id = (SELECT id FROM listings WHERE title = 'Stokke Tripp Trapp barnestol' AND deleted_at IS NULL);
 
UPDATE listing_images
SET url = 'https://samicenkci-marketplace-images.s3.eu-north-1.amazonaws.com/listings/tyres.avif'
WHERE listing_id = (SELECT id FROM listings WHERE title = 'Vinterdekk 205/55 R16, 4 stk' AND deleted_at IS NULL);
 
UPDATE listing_images
SET url = 'https://samicenkci-marketplace-images.s3.eu-north-1.amazonaws.com/listings/boxes.avif'
WHERE listing_id = (SELECT id FROM listings WHERE title = 'Flyttekasser - gis bort' AND deleted_at IS NULL);
 
UPDATE listing_images
SET url = 'https://samicenkci-marketplace-images.s3.eu-north-1.amazonaws.com/listings/coffee-table.webp'
WHERE listing_id = (SELECT id FROM listings WHERE title = 'Sofabord i glass - gis bort' AND deleted_at IS NULL);
 
-- Sanity check: any listing still pointing at a placeholder didn't get updated.
SELECT l.title, i.url
FROM listings l
JOIN listing_images i ON i.listing_id = l.id
WHERE l.deleted_at IS NULL
  AND i.url NOT LIKE '%samicenkci-marketplace-images%';