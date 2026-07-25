const LISTING_LIFETIME_DAYS = 60;

// Returns days remaining until a listing expires (can be negative if expired)
export function daysLeft(createdAt: string): number {
  const created = new Date(createdAt).getTime();
  const expires = created + LISTING_LIFETIME_DAYS * 24 * 60 * 60 * 1000;
  const msLeft = expires - Date.now();
  return Math.ceil(msLeft / (24 * 60 * 60 * 1000));
}

// A friendly label for the time left. This is a plain lib without hook
// access, so the caller passes in `t` from useLanguage().
export function expiryLabel(
  createdAt: string,
  t: (key: string, vars?: Record<string, string | number>) => string
): string {
  const d = daysLeft(createdAt);
  if (d <= 0) return t("common.expired");
  if (d === 1) return t("listing.oneDayLeft");
  return t("listing.daysLeft", { n: d });
}
