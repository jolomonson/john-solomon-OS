import { z } from "zod";
import {
  isoDate,
  optionalDate,
  optionalInt,
  optionalNumber,
  optionalOptionValue,
  optionalText,
  optionalUuid,
  optionValue,
  quarter,
  requiredNumber,
  requiredText,
  uuid, toUpdateSchema } from "./common";

export const ATTENTION = ["active", "maintenance", "parked", "partnership", "work", "killed"] as const;
/** Attention values a user can pick directly. 'killed' only via kill_asset(). */
export const SETTABLE_ATTENTION = ["active", "maintenance", "parked", "partnership", "work"] as const;
export const OWNERSHIP = ["personal", "partnership", "work"] as const;
export type Attention = (typeof ATTENTION)[number];

// ---- assets ---------------------------------------------------------------
export const assetSchema = z.object({
  name: requiredText(120),
  parent_id: optionalUuid,
  type: optionValue,
  ownership: z.enum(OWNERSHIP),
  role: optionalText(120),
  sector: optionalText(120),
  url: optionalText(500),
  stage: optionalOptionValue,
  attention: z.enum(SETTABLE_ATTENTION).default("maintenance"),
  priority: optionalInt(0, 1000),
  objective_2027: optionalText(2000),
  monthly_expenses_ngn: optionalNumber,
  cash_available_ngn: optionalNumber,
  notes: optionalText(),
  custom: z.record(z.string(), z.json()).default({}),
});
export const assetUpdateSchema = toUpdateSchema(assetSchema);

export const killAssetSchema = z.object({
  asset_id: uuid,
  reasoning: requiredText(5000).describe("What was learned"),
  title: optionalText(200),
  options: optionalText(5000),
  outcome: optionalText(5000),
  decided_on: optionalDate,
  review_on: optionalDate,
});

// ---- equity_stakes ----------------------------------------------------------
export const equityStakeSchema = z.object({
  asset_id: uuid,
  ownership_pct: optionalNumber.refine((n) => n === null || (n >= 0 && n <= 100), "0–100"),
  valuation_basis: optionalText(500),
  company_value_ngn: optionalNumber,
  annual_revenue_ngn: optionalNumber,
  last_updated: optionalDate,
});
export const equityStakeUpdateSchema = toUpdateSchema(equityStakeSchema);

// ---- projects -----------------------------------------------------------------
export const PROJECT_STATUS = ["not_started", "in_progress", "blocked", "done", "dropped"] as const;
export const projectSchema = z.object({
  title: requiredText(200),
  asset_id: optionalUuid,
  goal_id: optionalUuid,
  quarter: quarter.nullish().transform((v) => v ?? null),
  status: z.enum(PROJECT_STATUS).default("not_started"),
  start_date: optionalDate,
  due_date: optionalDate,
  next_milestone: optionalText(500),
  notes: optionalText(),
});
export const projectUpdateSchema = toUpdateSchema(projectSchema);

// ---- tasks (Signal vs Noise) ------------------------------------------------
export const TASK_KIND = ["signal", "noise"] as const;
export const TASK_PRIORITY = ["high", "medium", "low"] as const;

export const taskSchema = z.object({
  title: requiredText(500),
  task_date: isoDate,
  asset_id: optionalUuid,
  project_id: optionalUuid,
  /** Omit to let the DB derive it from the asset. Sending kind with kind_overridden=true pins it. */
  kind: z.enum(TASK_KIND).optional(),
  kind_overridden: z.boolean().default(false),
  status: optionValue.default("todo"),
  status_note: optionalText(500),
  priority: z.enum(TASK_PRIORITY).default("medium"),
  is_top3: z.boolean().default(false),
  links: z
    .union([z.array(z.string()), z.string()])
    .nullish()
    .transform((v) => (Array.isArray(v) ? v : (v ?? "").split(/\s+/)).map((s) => s.trim()).filter(Boolean)),
  carried_from: optionalUuid,
  notes: optionalText(),
  source: z.string().default("app"),
  import_key: optionalText(200),
});
export const taskUpdateSchema = toUpdateSchema(taskSchema);

// ---- quarterly_objectives (an asset's row = its One Thing for the quarter) ----
export const quarterlyObjectiveSchema = z.object({
  quarter,
  theme: optionalText(200),
  asset_id: optionalUuid,
  goal_id: optionalUuid,
  title: requiredText(500),
  kpi_name: optionalText(120),
  starting: optionalNumber,
  target: optionalNumber,
  actual: optionalNumber,
  status: optionValue.default("not_started"),
});
export const quarterlyObjectiveUpdateSchema = toUpdateSchema(quarterlyObjectiveSchema);

// ---- monthly_plans --------------------------------------------------------------
export const monthlyPlanSchema = z.object({
  month: isoDate.refine((d) => d.endsWith("-01"), "Use the first day of the month"),
  asset_id: optionalUuid,
  area: optionalText(120),
  one_thing: requiredText(500),
  money_target_ngn: optionalNumber,
  notes: optionalText(),
});
export const monthlyPlanUpdateSchema = toUpdateSchema(monthlyPlanSchema);

// ---- weekly_plans / weekly_priorities ---------------------------------------
export const weeklyPlanSchema = z.object({
  week_start: isoDate,
  one_thing: optionalText(500),
  notes: optionalText(),
});
export const weeklyPlanUpdateSchema = toUpdateSchema(weeklyPlanSchema);

export const WEEKLY_PRIORITY_STATUS = ["open", "done", "dropped"] as const;
export const weeklyPrioritySchema = z.object({
  week_start: isoDate,
  asset_id: uuid,
  title: requiredText(500),
  status: z.enum(WEEKLY_PRIORITY_STATUS).default("open"),
  notes: optionalText(),
});
export const weeklyPriorityUpdateSchema = toUpdateSchema(weeklyPrioritySchema);

// ---- reviews -------------------------------------------------------------------
export const REVIEW_TYPE = ["weekly", "monthly", "quarterly", "annual"] as const;
export const reviewSchema = z
  .object({
    type: z.enum(REVIEW_TYPE),
    period_start: isoDate,
    period_end: isoDate,
    got_done: optionalText(),
    not_done: optionalText(),
    why: optionalText(),
    change_next: optionalText(),
    score: optionalInt(1, 10),
    snapshot: z.json().nullish().transform((v) => v ?? null),
  })
  .refine((r) => r.period_end >= r.period_start, { message: "End before start", path: ["period_end"] });
export const reviewUpdateSchema = z.object({
  got_done: optionalText(),
  not_done: optionalText(),
  why: optionalText(),
  change_next: optionalText(),
  score: optionalInt(1, 10),
}).partial();

// ---- kpis / kpi_readings --------------------------------------------------------
export const kpiSchema = z.object({
  asset_id: optionalUuid,
  goal_id: optionalUuid,
  name: requiredText(120),
  unit: optionalText(30),
  baseline: optionalNumber,
  target: optionalNumber,
  direction: z.enum(["up", "down"]).default("up"),
  sort: z.coerce.number().int().default(0),
});
export const kpiUpdateSchema = toUpdateSchema(kpiSchema);

export const kpiReadingSchema = z.object({
  kpi_id: uuid,
  reading_date: isoDate,
  value: requiredNumber,
  note: optionalText(500),
});
export const kpiReadingUpdateSchema = toUpdateSchema(kpiReadingSchema);
