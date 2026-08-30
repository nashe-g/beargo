const KEY = "beargo:pour-lab-streak";

type StreakState = {
  lastDate: string;
  count: number;
};

export function readPourStreak(): StreakState {
  if (typeof sessionStorage === "undefined") return { lastDate: "", count: 0 };
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return { lastDate: "", count: 0 };
    const parsed = JSON.parse(raw) as StreakState;
    if (!parsed.lastDate || !parsed.count) return { lastDate: "", count: 0 };
    return parsed;
  } catch {
    return { lastDate: "", count: 0 };
  }
}

export function recordPourStreak(date: string) {
  const current = readPourStreak();
  if (current.lastDate === date) return current;
  const yesterday = offsetDate(date, -1);
  const count = current.lastDate === yesterday ? current.count + 1 : 1;
  const next = { lastDate: date, count };
  sessionStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

function offsetDate(date: string, days: number) {
  const [year, month, day] = date.split("-").map(Number);
  const next = new Date(Date.UTC(year, month - 1, (day ?? 1) + days));
  return next.toISOString().slice(0, 10);
}
