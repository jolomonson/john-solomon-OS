/**
 * Date logic for 24 @ 24. Everything is computed in the user's timezone
 * (settings.timezone, default Africa/Lagos) — never the server's (Vercel = UTC).
 *
 * Calendar days are plain ISO strings ("YYYY-MM-DD"). Arithmetic on them is done
 * in UTC so DST and server offsets can never shift a day.
 *
 * SQL mirrors: public.app_today(), public.program_quarter() — keep in sync.
 */

export type ISODate = string; // "YYYY-MM-DD"
export type Quarter = "Q1" | "Q2" | "Q3" | "Q4";

export const DEFAULT_TIMEZONE = "Africa/Lagos";
const MS_PER_DAY = 86_400_000;
const ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isISODate(value: string): value is ISODate {
  const m = ISO_RE.exec(value);
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
}

function toUTC(date: ISODate): number {
  const m = ISO_RE.exec(date);
  if (!m) throw new Error(`Invalid ISO date: ${date}`);
  return Date.UTC(+m[1], +m[2] - 1, +m[3]);
}

function fromUTC(ms: number): ISODate {
  return new Date(ms).toISOString().slice(0, 10);
}

/** The calendar date "now" in `timeZone`. */
export function todayInTimeZone(timeZone: string = DEFAULT_TIMEZONE, now: Date = new Date()): ISODate {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** Whole days from `from` to `to` (to − from). */
export function diffDays(to: ISODate, from: ISODate): number {
  return Math.round((toUTC(to) - toUTC(from)) / MS_PER_DAY);
}

export function addDays(date: ISODate, days: number): ISODate {
  return fromUTC(toUTC(date) + days * MS_PER_DAY);
}

/** Days left = end_date − date, in whole days (never negative). 2026-11-02 → 348. */
export function daysLeft(endDate: ISODate, date: ISODate): number {
  return Math.max(0, diffDays(endDate, date));
}

/** Day number of the programme: start_date is Day 1. */
export function dayNumber(startDate: ISODate, date: ISODate): number {
  return diffDays(date, startDate) + 1;
}

export type ProgramClock = {
  today: ISODate;
  /** 1-based day number, clamped to [1, totalDays] while running. */
  day: number;
  totalDays: number;
  daysLeft: number;
  phase: "before" | "running" | "ended";
  /** Days until start (only meaningful when phase = "before"). */
  daysUntilStart: number;
  quarter: Quarter | null;
};

export type ClockSettings = {
  start_date: ISODate;
  end_date: ISODate;
  timezone?: string | null;
};

export function programClock(settings: ClockSettings, now: Date = new Date()): ProgramClock {
  const today = todayInTimeZone(settings.timezone || DEFAULT_TIMEZONE, now);
  const totalDays = diffDays(settings.end_date, settings.start_date);
  const rawDay = dayNumber(settings.start_date, today);
  const phase = rawDay < 1 ? "before" : today > settings.end_date ? "ended" : "running";
  return {
    today,
    day: Math.min(Math.max(rawDay, 1), totalDays),
    totalDays,
    daysLeft: daysLeft(settings.end_date, today),
    phase,
    daysUntilStart: Math.max(0, diffDays(settings.start_date, today)),
    quarter: programQuarter(today, settings.start_date, settings.end_date),
  };
}

/** Calendar quarter index (year*4 + 0..3). */
function calendarQuarterIndex(date: ISODate): number {
  const [y, m] = date.split("-").map(Number);
  return y * 4 + Math.floor((m - 1) / 3);
}

/**
 * 24 @ 24 quarter for a date: calendar quarters numbered from the one that
 * contains start_date; everything after Q3 is Q4 until end_date.
 * Defaults → Q1 16 Oct–31 Dec 2026, Q2 Jan–Mar, Q3 Apr–Jun, Q4 1 Jul–16 Oct 2027.
 * Null outside [start, end].
 */
export function programQuarter(date: ISODate, startDate: ISODate, endDate: ISODate): Quarter | null {
  if (date < startDate || date > endDate) return null;
  const n = Math.min(4, calendarQuarterIndex(date) - calendarQuarterIndex(startDate) + 1);
  return `Q${n}` as Quarter;
}

/** Inclusive date range of a quarter, clipped to the programme. */
export function quarterRange(q: Quarter, startDate: ISODate, endDate: ISODate): { start: ISODate; end: ISODate } {
  const n = Number(q.slice(1));
  const [sy, sm] = startDate.split("-").map(Number);
  const firstQuarterMonth = Math.floor((sm - 1) / 3) * 3; // 0-based month that starts start_date's calendar quarter
  const qStartMonthAbs = sy * 12 + firstQuarterMonth + (n - 1) * 3;
  const qStart = fromUTC(Date.UTC(Math.floor(qStartMonthAbs / 12), qStartMonthAbs % 12, 1));
  const start = n === 1 ? startDate : qStart;
  let end: ISODate;
  if (n === 4) {
    end = endDate;
  } else {
    const nextAbs = qStartMonthAbs + 3;
    end = addDays(fromUTC(Date.UTC(Math.floor(nextAbs / 12), nextAbs % 12, 1)), -1);
    if (end > endDate) end = endDate;
  }
  return { start: start < startDate ? startDate : start, end };
}

/** First day of the date's calendar month. */
export function monthStart(date: ISODate): ISODate {
  return `${date.slice(0, 7)}-01`;
}

/** Start of the week containing `date`. weekStartsOn: 0 = Sunday … 6 = Saturday. */
export function weekStart(date: ISODate, weekStartsOn: number = 0): ISODate {
  const dow = new Date(toUTC(date)).getUTCDay();
  return addDays(date, -((dow - weekStartsOn + 7) % 7));
}

/** All months (first days) from start's month to end's month, inclusive. */
export function programMonths(startDate: ISODate, endDate: ISODate): ISODate[] {
  const out: ISODate[] = [];
  let [y, m] = startDate.split("-").map(Number);
  const [ey, em] = endDate.split("-").map(Number);
  while (y < ey || (y === ey && m <= em)) {
    out.push(`${y}-${String(m).padStart(2, "0")}-01`);
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return out;
}
