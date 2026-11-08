import { z } from "zod";
import { isValidTimeZone, isoDate, optionalInt, optionalNumber, optionalText, requiredText, toUpdateSchema } from "./common";

// ---- settings --------------------------------------------------------------
export const settingsUpdateSchema = z
  .object({
    owner_name: optionalText(100),
    start_date: isoDate,
    end_date: isoDate,
    timezone: z.string().trim().refine(isValidTimeZone, "Unknown timezone"),
    fx_ngn_per_usd: z.coerce.number().positive("Must be > 0"),
    stretch_target_usd: optionalNumber,
    base_target_usd: optionalNumber,
    countries_target: optionalInt(0, 1000),
    connections_target: optionalInt(0, 100000),
    max_active_assets: z.coerce.number().int().min(1).max(50),
    week_starts_on: z.coerce.number().int().min(0).max(6),
  })
  .partial()
  .refine((s) => !s.start_date || !s.end_date || s.end_date > s.start_date, {
    message: "End date must be after start date",
    path: ["end_date"],
  });
export type SettingsUpdate = z.output<typeof settingsUpdateSchema>;

// ---- option_sets -----------------------------------------------------------
export const OPTION_SET_KEYS = [
  "goal_category",
  "asset_type",
  "stage",
  "capital_engine",
  "task_status",
  "contact_category",
  "expense_category",
  "learning_type",
] as const;

export const optionSetSchema = z.object({
  set_key: z
    .string()
    .trim()
    .regex(/^[a-z][a-z0-9_]{1,49}$/, "lowercase_snake_case"),
  value: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9][A-Za-z0-9_\-]{0,49}$/, "Letters, numbers, _ or -"),
  label: requiredText(100),
  color: optionalText(30),
  sort: z.coerce.number().int().default(0),
  archived: z.boolean().default(false),
});
export const optionSetUpdateSchema = toUpdateSchema(optionSetSchema);
