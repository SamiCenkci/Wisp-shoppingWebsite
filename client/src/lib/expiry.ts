const LISTING_LIFETIME_DAYS = 60;

// Returns days remaining until a listing expires (can be negative if expired)
export function daysLeft(createdAt: string): number {
  const created = new Date(createdAt).getTime();
  const expires = created + LISTING_LIFETIME_DAYS * 24 * 60 * 60 * 1000;
  const msLeft = expires - Date.now();
  return Math.ceil(msLeft / (24 * 60 * 60 * 1000));
}

// A friendly Norwegian label for the time left
export function expiryLabel(createdAt: string): string {
  const d = daysLeft(createdAt);
  if (d <= 0) return "Utløpt";
  if (d === 1) return "1 dag igjen";
  return `${d} dager igjen`;
}