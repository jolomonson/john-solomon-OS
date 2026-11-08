import { createRepo } from "./repo";
import { journalEntrySchema, journalEntryUpdateSchema } from "@/lib/schemas/life";

/** Data access for public.journal_entries. */
export const journalEntriesRepo = createRepo("journal_entries", {
  create: journalEntrySchema,
  update: journalEntryUpdateSchema,
  defaultOrder: [{ column: "entry_date", ascending: false }],
  searchColumns: ["title", "body"],
});
