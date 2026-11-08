import { createRepo } from "./repo";
import { kpiReadingSchema, kpiReadingUpdateSchema } from "@/lib/schemas/portfolio";

/** Data access for public.kpi_readings. */
export const kpiReadingsRepo = createRepo("kpi_readings", {
  create: kpiReadingSchema,
  update: kpiReadingUpdateSchema,
  defaultOrder: [{ column: "reading_date", ascending: false }],
  searchColumns: ["note"],
});
