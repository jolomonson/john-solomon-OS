import { createRepo } from "./repo";
import { countrySchema, countryUpdateSchema } from "@/lib/schemas/life";

/** Data access for public.countries. */
export const countriesRepo = createRepo("countries", {
  create: countrySchema,
  update: countryUpdateSchema,
  defaultOrder: [{ column: "status" }, { column: "country" }],
  searchColumns: ["country", "purpose", "notes"],
});
