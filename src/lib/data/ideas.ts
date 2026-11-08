import { createRepo } from "./repo";
import { ideaSchema, ideaUpdateSchema } from "@/lib/schemas/life";

/** Data access for public.ideas. */
export const ideasRepo = createRepo("ideas", {
  create: ideaSchema,
  update: ideaUpdateSchema,
  defaultOrder: [{ column: "created_at", ascending: false }],
  searchColumns: ["title", "area", "why_parked"],
});
