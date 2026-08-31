export function localDateInZone(timeZone: string, at = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(at);
}

/**
 * A bar night runs past midnight. Everything before the boundary hour
 * (default 6 AM venue time) still counts as the previous service day, so
 * Friday 8 PM and Saturday 1:30 AM share one leaderboard and one seed.
 */
export function serviceDayInZone(
  timeZone: string,
  at = new Date(),
  boundaryHour = 6,
) {
  return localDateInZone(
    timeZone,
    new Date(at.getTime() - boundaryHour * 60 * 60 * 1000),
  );
}

export function addCalendarDays(dateStr: string, days: number) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  return next.toISOString().slice(0, 10);
}

export function dateRange(start: string, count: number) {
  return Array.from({ length: count }, (_, index) => addCalendarDays(start, index));
}

export function formatWeekday(dateStr: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function weekdayLongInZone(timeZone: string, at = new Date()) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    timeZone,
  }).format(at);
}
