import { createRepo } from "./repo";
import { decisionSchema, decisionUpdateSchema } from "@/lib/schemas/life";

/** Data access for public.decisions. */
export const decisionsRepo = createRepo("decisions", {
  create: decisionSchema,
  update: decisionUpdateSchema,
  defaultOrder: [{ column: "decided_on", ascending: false }],
  searchColumns: ["title", "options", "reasoning", "outcome"],
});
