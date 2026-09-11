export function relativeTime(
  timestamp: number,
  now: number = Date.now(),
): string {
  const diff = Math.max(now - timestamp, 0);
  const minutes = Math.floor(diff / 60_000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 60 * 24) return `${Math.floor(minutes / 60)}h`;
  if (minutes < 60 * 24 * 2) return "yesterday";
  if (minutes < 60 * 24 * 7) return `${Math.floor(minutes / (60 * 24))}d`;

  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
