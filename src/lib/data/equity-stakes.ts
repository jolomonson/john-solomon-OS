import { createRepo } from "./repo";
import { equityStakeSchema, equityStakeUpdateSchema } from "@/lib/schemas/portfolio";

/** Data access for public.equity_stakes. */
export const equityStakesRepo = createRepo("equity_stakes", {
  create: equityStakeSchema,
  update: equityStakeUpdateSchema,
  defaultOrder: [{ column: "last_updated", ascending: false }],
  searchColumns: ["valuation_basis"],
});
