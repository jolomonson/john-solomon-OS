import { quarterlyObjectiveSchema, quarterlyObjectiveUpdateSchema } from "@/lib/schemas/portfolio";
import type { Quarter } from "@/lib/dates";
import { toDataError } from "./errors";
import { createRepo, type Db, type Row } from "./repo";

const base = createRepo("quarterly_objectives", {
  create: quarterlyObjectiveSchema,
  update: quarterlyObjectiveUpdateSchema,
  defaultOrder: [{ column: "quarter" }, { column: "title" }],
  searchColumns: ["title", "theme", "kpi_name"],
});

/**
 * Data access for public.quarterly_objectives. An asset's row for a quarter is
 * its One Thing (single source of truth; unique per user/quarter/asset).
 */
export const quarterlyObjectivesRepo = {
  ...base,

  async getOneThing(db: Db, assetId: string, quarter: Quarter): Promise<Row<"quarterly_objectives"> | null> {
    const { data, error } = await db
      .from("quarterly_objectives")
      .select("*")
      .eq("asset_id", assetId)
      .eq("quarter", quarter)
      .maybeSingle();
    if (error) throw toDataError(error);
    return data;
  },

  /** Create or update the asset's One Thing for the quarter. */
  async setOneThing(db: Db, assetId: string, quarter: Quarter, title: string) {
    const existing = await this.getOneThing(db, assetId, quarter);
    return existing
      ? base.update(db, existing.id, { title })
      : base.create(db, { quarter, asset_id: assetId, title });
  },
};
