import { createRepo } from "./repo";
import { monthlyPlanSchema, monthlyPlanUpdateSchema } from "@/lib/schemas/portfolio";

/** Data access for public.monthly_plans. */
export const monthlyPlansRepo = createRepo("monthly_plans", {
  create: monthlyPlanSchema,
  update: monthlyPlanUpdateSchema,
  defaultOrder: [{ column: "month", ascending: false }],
  searchColumns: ["one_thing", "area", "notes"],
});
