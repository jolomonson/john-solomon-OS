import { createRepo } from "./repo";
import { projectSchema, projectUpdateSchema } from "@/lib/schemas/portfolio";

/** Data access for public.projects. */
export const projectsRepo = createRepo("projects", {
  create: projectSchema,
  update: projectUpdateSchema,
  defaultOrder: [{ column: "due_date", ascending: true, nullsFirst: false }, { column: "title" }],
  searchColumns: ["title", "next_milestone", "notes"],
});
