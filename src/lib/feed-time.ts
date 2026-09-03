export function timeAgo(iso: string, now = Date.now()) {
  const delta = Math.max(0, now - new Date(iso).getTime());
  const minutes = Math.round(delta / 60_000);
  if (minutes < 1) return "just now";
  if (minutes === 1) return "1 min ago";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours === 1) return "1 hr ago";
  if (hours < 24) return `${hours} hr ago`;
  return `${Math.round(hours / 24)}d ago`;
}
