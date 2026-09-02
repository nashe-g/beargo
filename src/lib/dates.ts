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

function zonedParts(timeZone: string, at: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(at);
  return Object.fromEntries(parts.map((part) => [part.type, part.value]));
}

/** UTC instant when `timeZone` local clock reads dateStr at hour:minute. */
export function zonedLocalToUtc(
  timeZone: string,
  dateStr: string,
  hour: number,
  minute = 0,
) {
  const [year, month, day] = dateStr.split("-").map(Number);
  let utc = Date.UTC(year, month - 1, day, hour, minute, 0);
  for (let i = 0; i < 12; i += 1) {
    const got = zonedParts(timeZone, new Date(utc));
    const actual = Date.UTC(
      Number(got.year),
      Number(got.month) - 1,
      Number(got.day),
      Number(got.hour),
      Number(got.minute),
      Number(got.second),
    );
    const target = Date.UTC(year, month - 1, day, hour, minute, 0);
    const delta = target - actual;
    if (Math.abs(delta) < 500) return new Date(utc);
    utc += delta;
  }
  return new Date(utc);
}

export function serviceDayWindow(
  timeZone: string,
  at = new Date(),
  boundaryHour = 6,
) {
  const localDate = serviceDayInZone(timeZone, at, boundaryHour);
  const start = zonedLocalToUtc(timeZone, localDate, boundaryHour);
  const end = zonedLocalToUtc(
    timeZone,
    addCalendarDays(localDate, 1),
    boundaryHour,
  );
  return { localDate, start, end };
}

export function weekdayLongInZone(timeZone: string, at = new Date()) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    timeZone,
  }).format(at);
}
