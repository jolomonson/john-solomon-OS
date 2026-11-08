import { goalSchema, goalUpdateSchema } from "@/lib/schemas/goals";
import { createRepo, listView, type Db, type ListOptions, type ViewRow } from "./repo";

/** Data access for public.goals (+ v_goal_progress). */
export const goalsRepo = {
  ...createRepo("goals", {
    create: goalSchema,
    update: goalUpdateSchema,
    defaultOrder: [{ column: "number" }],
    searchColumns: ["title", "outcome_2027", "kpi_name", "notes"],
  }),

  /** Goals with computed progress (0–1, null without a target). */
  listWithProgress(db: Db, opts: ListOptions<ViewRow<"v_goal_progress">> = {}) {
    return listView(db, "v_goal_progress", { order: [{ column: "number" }], ...opts });
  },
};
