import { createRepo } from "./repo";
import { investmentSchema, investmentUpdateSchema } from "@/lib/schemas/money";

/** Data access for public.investments. */
export const investmentsRepo = createRepo("investments", {
  create: investmentSchema,
  update: investmentUpdateSchema,
  defaultOrder: [{ column: "name" }],
  searchColumns: ["name", "type", "platform"],
});
