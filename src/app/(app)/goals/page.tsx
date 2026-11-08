import { Suspense } from "react";
import { PageSkeleton } from "@/components/page-skeleton";
import type { Metadata } from "next";
import { ComingInPhase, PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { goalsRepo } from "@/lib/data/goals";
import { optionSetsRepo } from "@/lib/data/option-sets";
import { formatPct } from "@/lib/format";

export const metadata: Metadata = { title: "Goals" };

/** Static shell; per-user data streams in behind Suspense (Cache Components). */
export default function GoalsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <GoalsContent />
    </Suspense>
  );
}

async function GoalsContent() {
  const { db } = await requireUser();
  const [goals, categories] = await Promise.all([goalsRepo.listWithProgress(db), optionSetsRepo.listBySet(db, "goal_category")]);

  return (
    <>
      <PageHeader title="24 goals" description="6 categories × 4 goals" />
      <div className="grid gap-4 sm:grid-cols-2">
        {categories.map((c) => (
          <section key={c.id}>
            <h2 className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">{c.label}</h2>
            <ol className="divide-y rounded-lg border">
              {goals
                .filter((g) => g.category === c.value)
                .map((g) => (
                  <li key={g.id} className="flex items-baseline gap-2 px-3 py-2 text-sm">
                    <span className="tabular w-5 shrink-0 text-right font-mono text-xs text-muted-foreground">{g.number}</span>
                    <span className="min-w-0 flex-1">{g.title}</span>
                    {g.progress !== null && <span className="tabular shrink-0 font-mono text-xs">{formatPct(g.progress)}</span>}
                  </li>
                ))}
            </ol>
          </section>
        ))}
      </div>
      <div className="mt-4">
        <ComingInPhase phase={4}>Goal detail, KPI tracking, linked assets and quarterly focus.</ComingInPhase>
      </div>
    </>
  );
}
