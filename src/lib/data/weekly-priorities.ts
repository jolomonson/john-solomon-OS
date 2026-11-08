import { createRepo } from "./repo";
import { weeklyPrioritySchema, weeklyPriorityUpdateSchema } from "@/lib/schemas/portfolio";

/** Data access for public.weekly_priorities. */
export const weeklyPrioritiesRepo = createRepo("weekly_priorities", {
  create: weeklyPrioritySchema,
  update: weeklyPriorityUpdateSchema,
  defaultOrder: [{ column: "week_start", ascending: false }],
  searchColumns: ["title", "notes"],
});
