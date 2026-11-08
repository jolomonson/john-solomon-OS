import { createRepo } from "./repo";
import { incomeEntrySchema, incomeEntryUpdateSchema } from "@/lib/schemas/money";

/** Data access for public.income_entries. */
export const incomeEntriesRepo = createRepo("income_entries", {
  create: incomeEntrySchema,
  update: incomeEntryUpdateSchema,
  defaultOrder: [{ column: "entry_date", ascending: false }],
  searchColumns: ["description", "engine"],
});
