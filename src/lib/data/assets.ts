import type { z } from "zod";
import { assetSchema, assetUpdateSchema, killAssetSchema, type Attention } from "@/lib/schemas/portfolio";
import { toDataError } from "./errors";
import { createRepo, listView, type Db, type ListOptions, type Row, type ViewRow } from "./repo";

export type Asset = Row<"assets">;
export type AssetFocus = ViewRow<"v_asset_focus">;

const base = createRepo("assets", {
  create: assetSchema,
  update: assetUpdateSchema,
  defaultOrder: [{ column: "priority", nullsFirst: false }, { column: "name" }],
  searchColumns: ["name", "role", "sector", "url", "notes", "objective_2027"],
});

/**
 * Data access for public.assets.
 * - Default lists hide killed assets (pass includeKilled to see history).
 * - Max-active is enforced by the DB; a 6th active raises DataError code MAX_ACTIVE_ASSETS.
 * - Killing goes through kill_asset() so the Decision Log entry is written atomically.
 */
export const assetsRepo = {
  ...base,

  list(db: Db, opts: ListOptions<Asset> & { includeKilled?: boolean } = {}) {
    const { includeKilled, ...rest } = opts;
    const filters = [...(rest.filters ?? [])];
    if (!includeKilled) filters.push({ column: "attention", op: "neq", value: "killed" });
    return base.list(db, { ...rest, filters });
  },

  listActive(db: Db) {
    return base.list(db, { filters: [{ column: "attention", op: "eq", value: "active" }] });
  },

  setAttention(db: Db, id: string, attention: Exclude<Attention, "killed">) {
    return base.update(db, id, { attention });
  },

  /** Inserts the decision and sets attention='killed' in one transaction. Returns the decision id. */
  async kill(db: Db, input: z.input<typeof killAssetSchema>): Promise<string> {
    const v = killAssetSchema.parse(input);
    const { data, error } = await db.rpc("kill_asset", {
      p_asset_id: v.asset_id,
      p_reasoning: v.reasoning,
      p_title: v.title ?? undefined,
      p_options: v.options ?? undefined,
      p_outcome: v.outcome ?? undefined,
      p_decided_on: v.decided_on ?? undefined,
      p_review_on: v.review_on ?? undefined,
    });
    if (error) throw toDataError(error);
    return data;
  },

  /**
   * Per non-killed asset: current quarter's One Thing, the red-badge flag
   * (active without a one thing), and open tasks this week (>7 = warn).
   */
  focus(db: Db, opts: ListOptions<AssetFocus> = {}) {
    return listView(db, "v_asset_focus", { order: [{ column: "name" }], ...opts });
  },
};
