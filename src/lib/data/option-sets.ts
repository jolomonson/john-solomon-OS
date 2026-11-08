import { optionSetSchema, optionSetUpdateSchema } from "@/lib/schemas/core";
import { toDataError } from "./errors";
import { createRepo, type Db, type Row } from "./repo";

export type OptionRow = Row<"option_sets">;

/** Data access for public.option_sets (every dropdown in the app). */
export const optionSetsRepo = {
  ...createRepo("option_sets", {
    create: optionSetSchema,
    update: optionSetUpdateSchema,
    defaultOrder: [{ column: "set_key" }, { column: "sort" }, { column: "label" }],
    searchColumns: ["label", "value"],
  }),

  /** Options for one dropdown, in display order. */
  async listBySet(db: Db, setKey: string, opts: { includeArchived?: boolean } = {}): Promise<OptionRow[]> {
    let q = db.from("option_sets").select("*").eq("set_key", setKey);
    if (!opts.includeArchived) q = q.eq("archived", false);
    const { data, error } = await q.order("sort").order("label");
    if (error) throw toDataError(error);
    return data;
  },

  /** All options grouped by set_key (one round-trip for a whole form). */
  async grouped(db: Db, opts: { includeArchived?: boolean } = {}): Promise<Record<string, OptionRow[]>> {
    let q = db.from("option_sets").select("*");
    if (!opts.includeArchived) q = q.eq("archived", false);
    const { data, error } = await q.order("set_key").order("sort").order("label");
    if (error) throw toDataError(error);
    const out: Record<string, OptionRow[]> = {};
    for (const row of data) (out[row.set_key] ??= []).push(row);
    return out;
  },
};
