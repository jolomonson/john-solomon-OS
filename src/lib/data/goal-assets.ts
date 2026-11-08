import { goalAssetSchema } from "@/lib/schemas/goals";
import type { z } from "zod";
import { toDataError } from "./errors";
import type { Db, Row } from "./repo";

/** Data access for public.goal_assets (many-to-many; composite key, no id). */
export const goalAssetsRepo = {
  async list(db: Db, filter: { goal_id?: string; asset_id?: string } = {}): Promise<Row<"goal_assets">[]> {
    let q = db.from("goal_assets").select("*");
    if (filter.goal_id) q = q.eq("goal_id", filter.goal_id);
    if (filter.asset_id) q = q.eq("asset_id", filter.asset_id);
    const { data, error } = await q;
    if (error) throw toDataError(error);
    return data;
  },

  async link(db: Db, input: z.input<typeof goalAssetSchema>): Promise<void> {
    const values = goalAssetSchema.parse(input);
    const { error } = await db.from("goal_assets").upsert(values, { onConflict: "goal_id,asset_id", ignoreDuplicates: true });
    if (error) throw toDataError(error);
  },

  async unlink(db: Db, input: z.input<typeof goalAssetSchema>): Promise<void> {
    const { goal_id, asset_id } = goalAssetSchema.parse(input);
    const { error } = await db.from("goal_assets").delete().eq("goal_id", goal_id).eq("asset_id", asset_id);
    if (error) throw toDataError(error);
  },

  /** Replace all asset links for a goal. */
  async setForGoal(db: Db, goalId: string, assetIds: string[]): Promise<void> {
    const current = await this.list(db, { goal_id: goalId });
    const want = new Set(assetIds);
    const have = new Set(current.map((r) => r.asset_id));
    for (const id of have) if (!want.has(id)) await this.unlink(db, { goal_id: goalId, asset_id: id });
    for (const id of want) if (!have.has(id)) await this.link(db, { goal_id: goalId, asset_id: id });
  },
};
