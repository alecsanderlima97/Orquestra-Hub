export const DEFAULT_SUBSCRIPTION_GRACE_DAYS = 5;

export function normalizeSubscriptionGraceDays(value: unknown) {
  if (value === undefined || value === null || value === "") return DEFAULT_SUBSCRIPTION_GRACE_DAYS;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_SUBSCRIPTION_GRACE_DAYS;
  return Math.min(60, Math.max(0, Math.floor(parsed)));
}
