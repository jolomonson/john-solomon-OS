import type { z } from "zod";
import { weeklyPlanSchema, weeklyPlanUpdateSchema } from "@/lib/schemas/portfolio";
import type { ISODate } from "@/lib/dates";
import { toDataError } from "./errors";
import { createRepo, type Db, type Row } from "./repo";

const base = createRepo("weekly_plans", {
  create: weeklyPlanSchema,
  update: weeklyPlanUpdateSchema,
  defaultOrder: [{ column: "week_start", ascending: false }],
  searchColumns: ["one_thing", "notes"],
});

/** Data access for public.weekly_plans (one per week: the week's overall one thing + notes). */
export const weeklyPlansRepo = {
  ...base,

  async getForWeek(db: Db, weekStart: ISODate): Promise<Row<"weekly_plans"> | null> {
    const { data, error } = await db.from("weekly_plans").select("*").eq("week_start", weekStart).maybeSingle();
    if (error) throw toDataError(error);
    return data;
  },

  async upsertForWeek(db: Db, input: z.input<typeof weeklyPlanSchema>): Promise<Row<"weekly_plans">> {
    const values = weeklyPlanSchema.parse(input);
    const { data, error } = await db
      .from("weekly_plans")
      .upsert(values, { onConflict: "user_id,week_start" })
      .select("*")
      .single();
    if (error) throw toDataError(error);
    return data;
  },
};
