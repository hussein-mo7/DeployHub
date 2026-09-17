const DEFAULT_ACCESS_TTL_SECONDS = 900;

/** Proactive refresh at ~80% of access token lifetime (min 1 minute). */
export function getProactiveRefreshIntervalMs(accessTokenTtlSeconds?: number | null): number {
  const ttlSeconds = accessTokenTtlSeconds ?? DEFAULT_ACCESS_TTL_SECONDS;
  const ttlMs = ttlSeconds * 1000;
  return Math.max(60_000, Math.floor(ttlMs * 0.8));
}
