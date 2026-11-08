import { Suspense } from "react";
import { PageSkeleton } from "@/components/page-skeleton";
import type { Metadata } from "next";
import { ComingInPhase, PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { assetsRepo } from "@/lib/data/assets";
import { getSettings } from "@/lib/data/settings";
import { tasksRepo } from "@/lib/data/tasks";
import { ATTENTION_STYLE } from "@/lib/attention";
import { programClock } from "@/lib/dates";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Today" };

/** Static shell; per-user data streams in behind Suspense (Cache Components). */
export default function TodayPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <TodayContent />
    </Suspense>
  );
}

async function TodayContent() {
  const { db } = await requireUser();
  const settings = await getSettings();
  const clock = programClock(settings);
  const [tasks, focus] = await Promise.all([tasksRepo.listForDate(db, clock.today), assetsRepo.focus(db)]);
  const active = focus.filter((f) => f.attention === "active");
  const signal = tasks.filter((t) => t.kind === "signal");
  const noise = tasks.filter((t) => t.kind === "noise");

  return (
    <>
      <PageHeader
        title="Signal vs Noise"
        description={`${new Date(`${clock.today}T12:00:00Z`).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" })} · ${clock.quarter ?? ""}`}
      />
      <section className="mb-4">
        <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Active assets · {clock.quarter} one thing</h2>
        <ul className="divide-y rounded-lg border">
          {active.map((a) => (
            <li key={a.asset_id} className="flex items-center gap-2 px-3 py-2 text-sm">
              <span className={cn("size-2 shrink-0 rounded-full", ATTENTION_STYLE.active.dot)} />
              <span className="font-medium">{a.name}</span>
              <span className="ml-auto truncate text-muted-foreground">
                {a.missing_one_thing ? (
                  <span className="rounded border border-att-active/40 bg-att-active/10 px-1.5 py-0.5 text-xs font-medium text-att-active">
                    No one thing for {a.current_quarter}
                  </span>
                ) : (
                  a.one_thing
                )}
              </span>
            </li>
          ))}
        </ul>
      </section>
      <p className="mb-4 text-sm text-muted-foreground">
        {signal.length} signal · {noise.length} noise today
      </p>
      <ComingInPhase phase={1}>Daily task list with one-tap signal/noise, top 3, carry-over and quick add.</ComingInPhase>
    </>
  );
}
