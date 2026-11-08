import { kpiSchema, kpiUpdateSchema } from "@/lib/schemas/portfolio";
import { createRepo, listView, type Db, type ListOptions, type ViewRow } from "./repo";

/** Data access for public.kpis (+ v_kpi_latest). */
export const kpisRepo = {
  ...createRepo("kpis", {
    create: kpiSchema,
    update: kpiUpdateSchema,
    defaultOrder: [{ column: "sort" }, { column: "name" }],
    searchColumns: ["name", "unit"],
  }),

  /** Each KPI with its latest reading and direction-aware progress. */
  latest(db: Db, opts: ListOptions<ViewRow<"v_kpi_latest">> = {}) {
    return listView(db, "v_kpi_latest", { order: [{ column: "sort" }, { column: "name" }], ...opts });
  },
};
