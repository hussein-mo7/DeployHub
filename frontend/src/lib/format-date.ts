export function formatDistanceToNow(isoDate: string): string {
  const date = new Date(isoDate);
  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const absSeconds = Math.abs(seconds);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

  if (absSeconds < 60) return rtf.format(seconds, "second");
  if (absSeconds < 3600) return rtf.format(Math.round(seconds / 60), "minute");
  if (absSeconds < 86400) return rtf.format(Math.round(seconds / 3600), "hour");
  return rtf.format(Math.round(seconds / 86400), "day");
}

export function formatDateTime(isoDate: string): string {
  return new Date(isoDate).toLocaleString();
}
