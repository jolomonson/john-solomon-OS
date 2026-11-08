import { describe, expect, it } from "vitest";
import {
  daysLeft,
  dayNumber,
  programClock,
  programMonths,
  programQuarter,
  quarterRange,
  todayInTimeZone,
  weekStart,
} from "./dates";

const START = "2026-10-16";
const END = "2027-10-16";
const settings = { start_date: START, end_date: END, timezone: "Africa/Lagos" };

describe("days left (must match the Signal vs Noise sheet)", () => {
  it("2026-11-02 → 348", () => {
    expect(daysLeft(END, "2026-11-02")).toBe(348);
  });
  it("2026-11-07 → 343", () => {
    expect(daysLeft(END, "2026-11-07")).toBe(343);
  });
  it("start day → 365, end day → 0", () => {
    expect(daysLeft(END, START)).toBe(365);
    expect(daysLeft(END, END)).toBe(0);
  });
  it("day number: start is Day 1, 2026-11-07 is Day 23", () => {
    expect(dayNumber(START, START)).toBe(1);
    expect(dayNumber(START, "2026-11-07")).toBe(23);
  });
});

describe("timezone: today is computed in Africa/Lagos, not UTC", () => {
  it("2026-11-07 23:30 Lagos (22:30 UTC) is still Nov 7", () => {
    expect(todayInTimeZone("Africa/Lagos", new Date("2026-11-07T22:30:00Z"))).toBe("2026-11-07");
  });
  it("00:30 Lagos on Nov 8 (23:30 UTC Nov 7) is Nov 8 even though UTC says Nov 7", () => {
    expect(todayInTimeZone("Africa/Lagos", new Date("2026-11-07T23:30:00Z"))).toBe("2026-11-08");
  });
  it("programClock on 2026-11-07 23:30 Lagos → Day 23 of 365, 343 days left, Q1", () => {
    const c = programClock(settings, new Date("2026-11-07T22:30:00Z"));
    expect(c).toMatchObject({ today: "2026-11-07", day: 23, totalDays: 365, daysLeft: 343, phase: "running", quarter: "Q1" });
  });
  it("before start and after end", () => {
    expect(programClock(settings, new Date("2026-10-10T12:00:00Z"))).toMatchObject({ phase: "before", daysUntilStart: 6 });
    expect(programClock(settings, new Date("2027-10-20T12:00:00Z"))).toMatchObject({ phase: "ended", daysLeft: 0 });
  });
});

describe("quarters: calendar-month boundaries", () => {
  it("boundaries", () => {
    expect(programQuarter("2026-10-16", START, END)).toBe("Q1");
    expect(programQuarter("2026-12-31", START, END)).toBe("Q1");
    expect(programQuarter("2027-01-01", START, END)).toBe("Q2");
    expect(programQuarter("2027-03-31", START, END)).toBe("Q2");
    expect(programQuarter("2027-04-01", START, END)).toBe("Q3");
    expect(programQuarter("2027-06-30", START, END)).toBe("Q3");
    expect(programQuarter("2027-07-01", START, END)).toBe("Q4");
    expect(programQuarter("2027-10-16", START, END)).toBe("Q4");
    expect(programQuarter("2026-10-15", START, END)).toBeNull();
    expect(programQuarter("2027-10-17", START, END)).toBeNull();
  });
  it("ranges", () => {
    expect(quarterRange("Q1", START, END)).toEqual({ start: "2026-10-16", end: "2026-12-31" });
    expect(quarterRange("Q2", START, END)).toEqual({ start: "2027-01-01", end: "2027-03-31" });
    expect(quarterRange("Q3", START, END)).toEqual({ start: "2027-04-01", end: "2027-06-30" });
    expect(quarterRange("Q4", START, END)).toEqual({ start: "2027-07-01", end: "2027-10-16" });
  });
  it("every programme month belongs to exactly one quarter", () => {
    const months = programMonths(START, END);
    expect(months).toHaveLength(13);
    for (const m of months) {
      const firstInProgramme = m < START ? START : m;
      const q = programQuarter(firstInProgramme, START, END);
      expect(q).not.toBeNull();
      // last in-programme day of the month must be in the same quarter
      const [y, mo] = m.split("-").map(Number);
      const lastDay = new Date(Date.UTC(y, mo, 0)).toISOString().slice(0, 10);
      const lastInProgramme = lastDay > END ? END : lastDay;
      expect(programQuarter(lastInProgramme, START, END)).toBe(q);
    }
  });
});

describe("week start", () => {
  it("Sunday weeks: Sat 2026-11-07 → Sun 2026-11-01; Sun 2026-11-08 → itself", () => {
    expect(weekStart("2026-11-07", 0)).toBe("2026-11-01");
    expect(weekStart("2026-11-08", 0)).toBe("2026-11-08");
  });
  it("Monday weeks", () => {
    expect(weekStart("2026-11-08", 1)).toBe("2026-11-02");
  });
});
