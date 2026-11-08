import { Suspense } from "react";
import { PageSkeleton } from "@/components/page-skeleton";
import type { Metadata } from "next";
import { ComingInPhase, PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { ATTENTION_ORDER, ATTENTION_STYLE } from "@/lib/attention";
import { assetsRepo } from "@/lib/data/assets";
import { getSettings } from "@/lib/data/settings";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Portfolio" };

/** Static shell; per-user data streams in behind Suspense (Cache Components). */
export default function PortfolioPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PortfolioContent />
    </Suspense>
  );
}

async function PortfolioContent() {
  const { db } = await requireUser();
  const [assets, settings] = await Promise.all([assetsRepo.list(db), getSettings()]);
  const byId = new Map(assets.map((a) => [a.id, a]));
  const activeCount = assets.filter((a) => a.attention === "active").length;

  return (
    <>
      <PageHeader
        title="Portfolio"
        description={`${assets.length} assets · ${activeCount}/${settings.max_active_assets} active`}
      />
      <div className="space-y-4">
        {ATTENTION_ORDER.filter((att) => att !== "killed").map((att) => {
          const group = assets.filter((a) => a.attention === att);
          if (!group.length) return null;
          return (
            <section key={att}>
              <h2 className="mb-1.5 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <span className={cn("size-2 rounded-full", ATTENTION_STYLE[att].dot)} />
                {ATTENTION_STYLE[att].label} ({group.length})
              </h2>
              <ul className="divide-y rounded-lg border">
                {group.map((a) => (
                  <li key={a.id} className="flex items-center gap-2 px-3 py-2 text-sm">
                    <span className="min-w-0 truncate font-medium">{a.name}</span>
                    {a.parent_id && <span className="truncate text-xs text-muted-foreground">↳ {byId.get(a.parent_id)?.name}</span>}
                    <span className="ml-auto shrink-0 text-xs text-muted-foreground">{a.type}</span>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
      <div className="mt-4">
        <ComingInPhase phase={3}>Asset pages, attention changes with the max-active dialog, One Thing editing, KPIs and kill flow.</ComingInPhase>
      </div>
    </>
  );
}
