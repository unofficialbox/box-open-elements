import type { ChartScale } from "./cartesian-model.js";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
type CalendarParts = { year: number; month: number; day: number; hour: number; minute: number; second: number };
const partsAt = (value: number, timeZone: string): CalendarParts => {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(value);
  const number = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find(p => p.type === type)?.value);
  return { year: number("year"), month: number("month"), day: number("day"), hour: number("hour"), minute: number("minute"), second: number("second") };
};
const wallTime = (p: CalendarParts) => {
  const date = new Date(0);
  date.setUTCFullYear(p.year, p.month - 1, p.day);
  date.setUTCHours(p.hour, p.minute, p.second, 0);
  return date.valueOf();
};
/** Resolve a calendar boundary in an IANA zone without assuming every day is 24 hours. */
const instant = (p: CalendarParts, zone: string) => {
  const target = wallTime(p);
  let guess = target;
  for (let i = 0; i < 6; i++) {
    const delta = target - wallTime(partsAt(guess, zone));
    if (delta === 0) return guess;
    guess += delta;
  }
  return guess;
};

export function calendarScale(values: number[], timeZone = "UTC", count = 5): ChartScale {
  // Constructing the formatter validates the zone; invalid zones never silently become local time.
  new Intl.DateTimeFormat("en", { timeZone }).format(0);
  let low = Infinity, high = -Infinity;
  for (const v of values) { low = Math.min(low, v); high = Math.max(high, v); }
  if (!Number.isFinite(low) || !Number.isFinite(high) || Math.abs(low) > 8.64e15 || Math.abs(high) > 8.64e15) throw new Error("Time coordinates must be valid epoch milliseconds.");
  if (new Date(low).getUTCFullYear()<1||new Date(high).getUTCFullYear()>9999) throw new Error("Calendar axes support years 1–9999.");
  if (low === high) { low -= HOUR / 2; high += HOUR / 2; }
  const span = high - low;
  const unit = span <= 2 * DAY ? "hour" : span <= 90 * DAY ? "day" : span <= 3 * 366 * DAY ? "month" : "year";
  const p = partsAt(low, timeZone);
  p.minute = 0; p.second = 0;
  if (unit !== "hour") p.hour = 0;
  if (unit === "month" || unit === "year") p.day = 1;
  if (unit === "year") p.month = 1;
  const roughUnits = span / (unit === "hour" ? HOUR : unit === "day" ? DAY : unit === "month" ? 30 * DAY : 366 * DAY);
  const step = Math.max(1, Math.ceil(roughUnits / Math.max(2, count)));
  const ticks: number[] = [];
  let cursor = instant(p, timeZone);
  for (let i = 0; i < 100 && cursor <= high; i++) {
    if (cursor >= low && (!ticks.length || cursor > ticks[ticks.length - 1])) ticks.push(cursor);
    if (unit === "hour") cursor += step * HOUR;
    else {
      const date = new Date(wallTime(p));
      if (unit === "day") date.setUTCDate(date.getUTCDate() + step);
      if (unit === "month") date.setUTCMonth(date.getUTCMonth() + step);
      if (unit === "year") date.setUTCFullYear(date.getUTCFullYear() + step);
      Object.assign(p, { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() });
      const next = instant(p, timeZone);
      if (next <= cursor) throw new Error("Cannot resolve increasing calendar boundaries in this zone.");
      cursor = next;
    }
  }
  if (!ticks.length) ticks.push(low, high);
  return { ticks, position: value => (value - low) / (high - low) };
}

export function formatCalendar(value: number, timeZone = "UTC", exact = false): string {
  return new Intl.DateTimeFormat("en", { timeZone, year: exact ? "numeric" : undefined, month: "short", day: "numeric", hour: exact ? "numeric" : undefined, minute: exact ? "2-digit" : undefined, timeZoneName: exact ? "short" : undefined }).format(value);
}

/** Include the zone on intraday ticks so repeated DST hours remain distinguishable. */
export function formatCalendarTick(value: number, timeZone: string, span: number): string {
  return new Intl.DateTimeFormat("en", { timeZone, month: "short", day: "numeric", ...(span <= 2 * DAY ? { hour: "numeric", minute: "2-digit", timeZoneName: "short" } as const : {}) }).format(value);
}
