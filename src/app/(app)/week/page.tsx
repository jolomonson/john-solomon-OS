import { Suspense } from "react";
import { PageSkeleton } from "@/components/page-skeleton";
import type { Metadata } from "next";
import { ComingInPhase, PageHeader } from "@/components/page-header";
import { getSettings } from "@/lib/data/settings";
import { addDays, programClock, weekStart } from "@/lib/dates";

export const metadata: Metadata = { title: "Week" };

/** Static shell; per-user data streams in behind Suspense (Cache Components). */
export default function WeekPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <WeekContent />
    </Suspense>
  );
}

async function WeekContent() {
  const settings = await getSettings();
  const { today } = programClock(settings);
  const start = weekStart(today, settings.week_starts_on);
  return (
    <>
      <PageHeader title="Week" description={`${start} → ${addDays(start, 6)}`} />
      <ComingInPhase phase={2}>Weekly plan, one priority per active asset, task load warnings and the Sunday review.</ComingInPhase>
    </>
  );
}
