import { describe, expect, it } from "vitest";
import { assetUpdateSchema, taskSchema, taskUpdateSchema } from "./portfolio";
import { incomeEntrySchema } from "./money";
import { optionalNumber } from "./common";

describe("update schemas never inject defaults", () => {
  it("editing an asset's name doesn't touch attention", () => {
    expect(assetUpdateSchema.parse({ name: "Mispar" })).toEqual({ name: "Mispar" });
  });
  it("editing a task's title doesn't reset status/priority/kind_overridden", () => {
    expect(taskUpdateSchema.parse({ title: "Ship v1" })).toEqual({ title: "Ship v1" });
  });
  it("explicit empty string still clears an optional field", () => {
    expect(taskUpdateSchema.parse({ status_note: "" })).toEqual({ status_note: null });
  });
});

describe("create schemas apply defaults", () => {
  it("task", () => {
    expect(taskSchema.parse({ title: " Call bank ", task_date: "2026-11-07" })).toMatchObject({
      title: "Call bank",
      status: "todo",
      priority: "medium",
      kind_overridden: false,
      is_top3: false,
      links: [],
      asset_id: null,
    });
  });
});

describe("form input coercion", () => {
  it("numbers from text inputs", () => {
    expect(optionalNumber.parse("27,000")).toBe(27000);
    expect(optionalNumber.parse("₦1,450")).toBe(1450);
    expect(optionalNumber.parse("")).toBeNull();
    expect(optionalNumber.safeParse("abc").success).toBe(false);
  });
  it("GBP/EUR income needs an FX rate; NGN/USD don't", () => {
    const base = { entry_date: "2026-10-20", engine: "other", amount: "100" };
    expect(incomeEntrySchema.safeParse({ ...base, currency: "NGN" }).success).toBe(true);
    expect(incomeEntrySchema.safeParse({ ...base, currency: "USD" }).success).toBe(true);
    expect(incomeEntrySchema.safeParse({ ...base, currency: "GBP" }).success).toBe(false);
    expect(incomeEntrySchema.safeParse({ ...base, currency: "GBP", fx_used: "1900" }).success).toBe(true);
  });
});
