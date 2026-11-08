import { z } from "zod";
import { optionalNumber, optionalText, optionValue, quarter, requiredText, uuid, toUpdateSchema } from "./common";

export const GOAL_STATUS = ["not_started", "in_progress", "done", "dropped"] as const;

export const goalSchema = z.object({
  number: z.coerce.number().int().min(1).max(99),
  title: requiredText(300),
  category: optionValue,
  outcome_2027: optionalText(2000),
  kpi_name: optionalText(120),
  kpi_unit: optionalText(30),
  baseline: optionalNumber,
  current: optionalNumber,
  target: optionalNumber,
  target_note: optionalText(500),
  status: z.enum(GOAL_STATUS).default("not_started"),
  q_focus: z.array(quarter).default([]),
  notes: optionalText(),
});
export const goalUpdateSchema = toUpdateSchema(goalSchema);

export const goalAssetSchema = z.object({ goal_id: uuid, asset_id: uuid });
