import { createRepo } from "./repo";
import { reviewSchema, reviewUpdateSchema } from "@/lib/schemas/portfolio";

/** Data access for public.reviews. */
export const reviewsRepo = createRepo("reviews", {
  create: reviewSchema,
  update: reviewUpdateSchema,
  defaultOrder: [{ column: "period_start", ascending: false }],
  searchColumns: ["got_done", "not_done", "why", "change_next"],
});
