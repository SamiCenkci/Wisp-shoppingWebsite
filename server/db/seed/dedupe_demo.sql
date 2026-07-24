-- The seed script ran more than once. Keep the oldest copy of each title
-- owned by the demo account and soft-delete the rest.
UPDATE listings SET deleted_at = NOW()
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY title ORDER BY created_at) AS rn
    FROM listings
    WHERE user_id = (SELECT id FROM users WHERE email = 'demo@wispapp.net')
      AND deleted_at IS NULL
  ) ranked
  WHERE rn > 1
);