import { createRepo } from "./repo";
import { learningItemSchema, learningItemUpdateSchema } from "@/lib/schemas/life";

/** Data access for public.learning_items. */
export const learningItemsRepo = createRepo("learning_items", {
  create: learningItemSchema,
  update: learningItemUpdateSchema,
  defaultOrder: [{ column: "created_at", ascending: false }],
  searchColumns: ["title", "area", "takeaway"],
});
