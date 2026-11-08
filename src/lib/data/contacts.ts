import { createRepo } from "./repo";
import { contactSchema, contactUpdateSchema } from "@/lib/schemas/life";

/** Data access for public.contacts. */
export const contactsRepo = createRepo("contacts", {
  create: contactSchema,
  update: contactUpdateSchema,
  defaultOrder: [{ column: "name" }],
  searchColumns: ["name", "organisation", "how_met", "next_step", "notes"],
});
