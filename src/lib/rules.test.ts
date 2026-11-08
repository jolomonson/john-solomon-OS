import { describe, expect, it } from "vitest";
import { defaultTaskKind, goalProgress, liquidCapitalNgn, netWorthNgn, ngnToUsd, toNgn } from "./rules";
import { formatNGN, formatPct, formatUSD } from "./format";

describe("signal vs noise default", () => {
  it("active → signal, others → noise, no asset → signal", () => {
    expect(defaultTaskKind("active")).toBe("signal");
    for (const a of ["maintenance", "parked", "partnership", "work", "killed"] as const) {
      expect(defaultTaskKind(a)).toBe("noise");
    }
    expect(defaultTaskKind(null)).toBe("signal");
  });
});

describe("money", () => {
  const b = {
    cash_ngn: 27_000,
    liquid_investments_ngn: 3_000,
    illiquid_investments_ngn: 10_000,
    business_equity_ngn: 1_000_000,
    other_assets_ngn: 500,
    liabilities_ngn: 2_000,
  };
  it("liquid capital never includes business equity", () => {
    expect(liquidCapitalNgn(b)).toBe(30_000);
  });
  it("net worth", () => {
    expect(netWorthNgn(b)).toBe(27_000 + 3_000 + 10_000 + 1_000_000 + 500 - 2_000);
  });
  it("USD = NGN / FX; ₦27,000 at 1450 ≈ $18.62", () => {
    expect(ngnToUsd(27_000, 1450)).toBeCloseTo(18.62, 2);
  });
  it("toNgn", () => {
    expect(toNgn(27_000, "NGN", null)).toBe(27_000);
    expect(toNgn(100, "USD", 1450)).toBe(145_000);
    expect(() => toNgn(100, "GBP", null)).toThrow();
  });
});

describe("goal progress", () => {
  it("clamps and handles missing target", () => {
    expect(goalProgress({ baseline: 0, current: 5, target: 20 })).toBe(0.25);
    expect(goalProgress({ baseline: 0, current: 50, target: 20 })).toBe(1);
    expect(goalProgress({ baseline: 10, current: 0, target: 20 })).toBe(0);
    expect(goalProgress({ baseline: 0, current: 5, target: null })).toBeNull();
  });
});

describe("formatting", () => {
  it("₦ with thousands separators", () => {
    expect(formatNGN(27000)).toBe("₦27,000");
    expect(formatNGN(1234.5)).toBe("₦1,234.50");
    expect(formatNGN(-500)).toBe("−₦500");
  });
  it("$ with 2 decimals for small amounts", () => {
    expect(formatUSD(18.62)).toBe("$18.62");
    expect(formatUSD(24_000_000)).toBe("$24,000,000");
    expect(formatUSD(24_000_000, { compact: true })).toBe("$24M");
  });
  it("tiny percentages are not shown as 0%", () => {
    expect(formatPct(18.62 / 24_000_000)).toBe("<1%");
    expect(formatPct(0.25)).toBe("25%");
  });
});
