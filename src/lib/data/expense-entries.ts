import { createRepo } from "./repo";
import { expenseEntrySchema, expenseEntryUpdateSchema } from "@/lib/schemas/money";

/** Data access for public.expense_entries. */
export const expenseEntriesRepo = createRepo("expense_entries", {
  create: expenseEntrySchema,
  update: expenseEntryUpdateSchema,
  defaultOrder: [{ column: "entry_date", ascending: false }],
  searchColumns: ["description", "category"],
});
