import { z } from "zod";
import {
  currency,
  isoDate,
  optionalDate,
  optionalNumber,
  optionalOptionValue,
  optionalText,
  optionalUuid,
  optionValue,
  requiredNumber,
  requiredText, toUpdateSchema } from "./common";

/**
 * fx_used = NGN per 1 unit of currency. Leave empty for NGN (→ 1) and USD (→
 * settings.fx_ngn_per_usd at entry time). GBP/EUR need it. amount_ngn is always
 * computed by the database trigger, so it is not part of the input.
 */
const fxRefine = <T extends { currency: string; fx_used: number | null }>(v: T) =>
  v.currency === "NGN" || v.currency === "USD" || (v.fx_used !== null && v.fx_used > 0);
const fxIssue = { message: "Enter the NGN rate for this currency", path: ["fx_used"] };

export const incomeEntrySchema = z
  .object({
    entry_date: isoDate,
    engine: optionValue,
    asset_id: optionalUuid,
    description: optionalText(500),
    amount: requiredNumber,
    currency: currency.default("NGN"),
    fx_used: optionalNumber,
  })
  .refine(fxRefine, fxIssue);
export const incomeEntryUpdateSchema = z
  .object({
    entry_date: isoDate,
    engine: optionValue,
    asset_id: optionalUuid,
    description: optionalText(500),
    amount: requiredNumber,
    currency,
    fx_used: optionalNumber,
  })
  .partial();

export const expenseEntrySchema = z
  .object({
    entry_date: isoDate,
    category: optionalOptionValue,
    description: optionalText(500),
    amount: requiredNumber,
    currency: currency.default("NGN"),
    fx_used: optionalNumber,
  })
  .refine(fxRefine, fxIssue);
export const expenseEntryUpdateSchema = z
  .object({
    entry_date: isoDate,
    category: optionalOptionValue,
    description: optionalText(500),
    amount: requiredNumber,
    currency,
    fx_used: optionalNumber,
  })
  .partial();

export const monthlySnapshotSchema = z.object({
  month: isoDate.transform((d) => `${d.slice(0, 7)}-01`),
  cash_ngn: optionalNumber,
  liquid_investments_ngn: optionalNumber,
  illiquid_investments_ngn: optionalNumber,
  business_equity_ngn: optionalNumber,
  other_assets_ngn: optionalNumber,
  liabilities_ngn: optionalNumber,
  fx_ngn_per_usd: optionalNumber.refine((n) => n === null || n > 0, "Must be > 0"),
  notes: optionalText(),
});
export const monthlySnapshotUpdateSchema = toUpdateSchema(monthlySnapshotSchema);

export const investmentSchema = z.object({
  name: requiredText(200),
  type: optionalText(60),
  platform: optionalText(120),
  is_liquid: z.boolean().default(true),
  cost_basis_ngn: optionalNumber,
  current_value_ngn: optionalNumber,
  last_updated: optionalDate,
});
export const investmentUpdateSchema = toUpdateSchema(investmentSchema);
