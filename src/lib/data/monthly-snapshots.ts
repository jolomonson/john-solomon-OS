import type { z } from "zod";
import { monthlySnapshotSchema, monthlySnapshotUpdateSchema } from "@/lib/schemas/money";
import { toDataError } from "./errors";
import { createRepo, listView, type Db, type Row, type ViewRow } from "./repo";

export type CapitalMonth = ViewRow<"v_capital_monthly">;

const base = createRepo("monthly_snapshots", {
  create: monthlySnapshotSchema,
  update: monthlySnapshotUpdateSchema,
  defaultOrder: [{ column: "month", ascending: false }],
  searchColumns: ["notes"],
});

/** Data access for public.monthly_snapshots (+ v_capital_monthly). */
export const monthlySnapshotsRepo = {
  ...base,

  /** One snapshot per month: create or replace that month's balances. */
  async upsertMonth(db: Db, input: z.input<typeof monthlySnapshotSchema>): Promise<Row<"monthly_snapshots">> {
    const values = monthlySnapshotSchema.parse(input);
    const { data, error } = await db
      .from("monthly_snapshots")
      .upsert(values, { onConflict: "user_id,month" })
      .select("*")
      .single();
    if (error) throw toDataError(error);
    return data;
  },

  /** Oct 2026 → Oct 2027, one row per month (is_carried_forward marks estimates). */
  capitalMonthly(db: Db): Promise<CapitalMonth[]> {
    return listView(db, "v_capital_monthly", { order: [{ column: "month" }] });
  },
};
