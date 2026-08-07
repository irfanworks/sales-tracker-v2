/** App display / business calendar timezone (WIB). Indonesia has no DST. */
export const APP_TIMEZONE = "Asia/Jakarta";
export const APP_UTC_OFFSET = "+07:00";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** Calendar date `YYYY-MM-DD` in Asia/Jakarta for an instant. */
export function jakartaDateKey(input: Date | string): string {
  const d = typeof input === "string" ? new Date(input) : input;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/** Yesterday's calendar date relative to a `YYYY-MM-DD` key (date-only arithmetic). */
export function previousDateKey(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const utc = new Date(Date.UTC(y, m - 1, d));
  utc.setUTCDate(utc.getUTCDate() - 1);
  return `${utc.getUTCFullYear()}-${pad2(utc.getUTCMonth() + 1)}-${pad2(utc.getUTCDate())}`;
}

/** Clock time `HH:mm` in Asia/Jakarta. */
export function formatJakartaTime(input: Date | string): string {
  const d = typeof input === "string" ? new Date(input) : input;
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: APP_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

/** e.g. `07 Aug 2026, 14:35` in Asia/Jakarta. */
export function formatJakartaDateTime(input: Date | string): string {
  const d = typeof input === "string" ? new Date(input) : input;
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: APP_TIMEZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

/** Inclusive day bounds for a Jakarta calendar date `YYYY-MM-DD`, as UTC ISO strings. */
export function jakartaDayBoundsUtc(dateOnly: string): { startIso: string; endIso: string } {
  const startIso = new Date(`${dateOnly}T00:00:00.000${APP_UTC_OFFSET}`).toISOString();
  const endIso = new Date(`${dateOnly}T23:59:59.999${APP_UTC_OFFSET}`).toISOString();
  return { startIso, endIso };
}

export function dayHeadingJakarta(iso: string): string {
  const key = jakartaDateKey(iso);
  const today = jakartaDateKey(new Date());
  const yesterday = previousDateKey(today);

  if (key === today) return "Today";
  if (key === yesterday) return "Yesterday";

  return new Intl.DateTimeFormat("en-GB", {
    timeZone: APP_TIMEZONE,
    weekday: "long",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

/** Today's `YYYY-MM-DD` in Asia/Jakarta (for default filters). */
export function jakartaTodayKey(): string {
  return jakartaDateKey(new Date());
}

/** Monday of the Jakarta week containing `dateKey` (or today). */
export function startOfWeekJakarta(dateKey: string = jakartaTodayKey()): string {
  const noon = new Date(`${dateKey}T12:00:00${APP_UTC_OFFSET}`);
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: APP_TIMEZONE,
    weekday: "short",
  }).format(noon);
  const offsetFromMonday: Record<string, number> = {
    Mon: 0,
    Tue: 1,
    Wed: 2,
    Thu: 3,
    Fri: 4,
    Sat: 5,
    Sun: 6,
  };
  const back = offsetFromMonday[weekday] ?? 0;
  let key = dateKey;
  for (let i = 0; i < back; i++) key = previousDateKey(key);
  return key;
}

export function daysAgoJakarta(days: number, fromKey: string = jakartaTodayKey()): string {
  let key = fromKey;
  for (let i = 0; i < days; i++) key = previousDateKey(key);
  return key;
}
