function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function localParts(timeZone: string, at = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(at);
  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "";
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(
    get("weekday"),
  );
  const hour = Number(get("hour"));
  const minute = Number(get("minute"));
  return {
    weekday,
    hour,
    minute,
    minutes: hour * 60 + minute,
    year: Number(get("year")),
    month: Number(get("month")),
    day: Number(get("day")),
  };
}

function shiftCivil(year: number, month: number, day: number, extra: number) {
  const date = new Date(Date.UTC(year, month - 1, day + extra));
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

export function zonedDate(
  timeZone: string,
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
) {
  let utc = Date.UTC(year, month - 1, day, hour, minute, 0);
  for (let i = 0; i < 4; i += 1) {
    const actual = localParts(timeZone, new Date(utc));
    const wanted =
      Date.UTC(year, month - 1, day, hour, minute) -
      Date.UTC(1970, 0, 1);
    const got =
      Date.UTC(
        actual.year,
        actual.month - 1,
        actual.day,
        actual.hour,
        actual.minute,
      ) - Date.UTC(1970, 0, 1);
    const delta = wanted - got;
    if (Math.abs(delta) < 1000) break;
    utc += delta;
  }
  return new Date(utc);
}

export function endOfLocalDays(timeZone: string, days: number, at = new Date()) {
  const now = localParts(timeZone, at);
  const civil = shiftCivil(now.year, now.month, now.day, days - 1);
  return zonedDate(timeZone, civil.year, civil.month, civil.day, 23, 59);
}

export function parseZonedDateTime(
  timeZone: string,
  date: string,
  time: string,
) {
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date.trim());
  const timeMatch = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(time.trim());
  if (!dateMatch || !timeMatch) return null;
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  if (hour > 23 || minute > 59) return null;
  return zonedDate(
    timeZone,
    Number(dateMatch[1]),
    Number(dateMatch[2]),
    Number(dateMatch[3]),
    hour,
    minute,
  );
}

export function nextLocalHour(timeZone: string, hour: number, at = new Date()) {
  const now = localParts(timeZone, at);
  let target = zonedDate(timeZone, now.year, now.month, now.day, hour, 0);
  if (target.getTime() <= at.getTime()) {
    const next = shiftCivil(now.year, now.month, now.day, 1);
    target = zonedDate(timeZone, next.year, next.month, next.day, hour, 0);
  }
  return target;
}

export function urgencyCopy(input: {
  timeZone: string;
  validMinutesEnd: number;
  at?: Date;
}) {
  const at = input.at ?? new Date();
  const now = localParts(input.timeZone, at);
  const remaining = input.validMinutesEnd - now.minutes;
  if (remaining > 0 && remaining <= 120) return "Next 2 hours";
  if (now.weekday === 5 || now.weekday === 6) return "This weekend";
  if (now.minutes >= 16 * 60) return "Tonight";
  return "Today";
}

export function formatMinutes(minutes: number) {
  const hour = Math.floor(minutes / 60) % 24;
  const minute = minutes % 60;
  const period = hour >= 12 ? "PM" : "AM";
  const twelve = hour % 12 === 0 ? 12 : hour % 12;
  return minute === 0
    ? `${twelve} ${period}`
    : `${twelve}:${pad(minute)} ${period}`;
}
