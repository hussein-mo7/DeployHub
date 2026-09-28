const DEFAULT_ACCESS_TTL_SECONDS = 900;

/** Proactive refresh interval — ~75% of access token TTL (min 2 minutes, max 14 minutes). */
export function getProactiveRefreshIntervalMs(accessTokenTtlSeconds?: number | null): number {
  const raw = accessTokenTtlSeconds ?? DEFAULT_ACCESS_TTL_SECONDS;
  const ttlSeconds = Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_ACCESS_TTL_SECONDS;
  const ttlMs = ttlSeconds * 1000;
  const interval = Math.floor(ttlMs * 0.75);
  if (!Number.isFinite(interval) || interval <= 0) {
    return Math.floor(DEFAULT_ACCESS_TTL_SECONDS * 1000 * 0.75);
  }
  return Math.min(14 * 60_000, Math.max(2 * 60_000, interval));
}
