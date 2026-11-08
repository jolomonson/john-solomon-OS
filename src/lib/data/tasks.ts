import { taskSchema, taskUpdateSchema } from "@/lib/schemas/portfolio";
import type { ISODate } from "@/lib/dates";
import { createRepo, type Db, type Row } from "./repo";

export type Task = Row<"tasks">;

const base = createRepo("tasks", {
  create: taskSchema,
  update: taskUpdateSchema,
  defaultOrder: [{ column: "task_date", ascending: false }, { column: "is_top3", ascending: false }, { column: "created_at" }],
  searchColumns: ["title", "status_note", "notes"],
});

/**
 * Data access for public.tasks — one row per line of the Signal vs Noise sheet.
 * kind defaults from the asset in the DB (tasks_before_write). To override,
 * update `kind` (the trigger marks it overridden); to reset, set kind_overridden=false.
 */
export const tasksRepo = {
  ...base,

  /** All tasks for one day: signal first, top-3 first, then by creation. */
  listForDate(db: Db, date: ISODate) {
    return base.list(db, {
      filters: [{ column: "task_date", op: "eq", value: date }],
      order: [{ column: "kind", ascending: false }, { column: "is_top3", ascending: false }, { column: "created_at" }],
    });
  },

  listBetween(db: Db, from: ISODate, to: ISODate) {
    return base.list(db, {
      filters: [
        { column: "task_date", op: "gte", value: from },
        { column: "task_date", op: "lte", value: to },
      ],
      order: [{ column: "task_date" }, { column: "created_at" }],
    });
  },

  /** One-tap signal/noise flip (marks the task as overridden). */
  setKind(db: Db, id: string, kind: "signal" | "noise") {
    return base.update(db, id, { kind, kind_overridden: true });
  },

  /** Return a task to its asset-derived kind. */
  resetKind(db: Db, id: string) {
    return base.update(db, id, { kind_overridden: false });
  },
};
