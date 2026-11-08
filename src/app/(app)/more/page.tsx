import { Suspense } from "react";
import { PageSkeleton } from "@/components/page-skeleton";
import type { Metadata } from "next";
import { ComingInPhase, PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { getSettings } from "@/lib/data/settings";
import type { TableName } from "@/lib/data/repo";

export const metadata: Metadata = { title: "More" };

/** Static shell; per-user data streams in behind Suspense (Cache Components). */
export default function MorePage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <MoreContent />
    </Suspense>
  );
}

const TABLES: TableName[] = [
  "option_sets", "goals", "assets", "goal_assets", "kpis", "kpi_readings", "projects", "tasks",
  "quarterly_objectives", "monthly_plans", "weekly_plans", "weekly_priorities", "reviews",
  "income_entries", "expense_entries", "monthly_snapshots", "investments", "equity_stakes",
  "contacts", "learning_items", "countries", "journal_entries", "decisions", "ideas",
];

async function MoreContent() {
  const { db, user } = await requireUser();
  const settings = await getSettings();
  const counts = await Promise.all(
    TABLES.map(async (t) => {
      const { count } = await db.from(t).select("*", { count: "exact", head: true });
      return [t, count ?? 0] as const;
    }),
  );

  return (
    <>
      <PageHeader title="More" description={user.email ?? undefined} />
      <section className="mb-4">
        <h2 className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">Settings</h2>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 rounded-lg border p-3 text-sm sm:grid-cols-3">
          <Item k="Owner" v={settings.owner_name ?? "—"} />
          <Item k="Period" v={`${settings.start_date} → ${settings.end_date}`} />
          <Item k="Timezone" v={settings.timezone} />
          <Item k="FX (₦/$)" v={String(settings.fx_ngn_per_usd)} />
          <Item k="Max active" v={String(settings.max_active_assets)} />
          <Item k="Week starts" v={["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][settings.week_starts_on]} />
          <Item k="Seeded" v={settings.seeded_at ? new Date(settings.seeded_at).toISOString().slice(0, 10) : "no"} />
        </dl>
      </section>
      <section className="mb-4">
        <h2 className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">Your data (rows)</h2>
        <ul className="tabular grid grid-cols-2 gap-x-4 rounded-lg border p-3 font-mono text-xs sm:grid-cols-3">
          {counts.map(([t, n]) => (
            <li key={t} className="flex justify-between py-0.5">
              <span className="text-muted-foreground">{t}</span>
              <span>{n}</span>
            </li>
          ))}
        </ul>
      </section>
      <ComingInPhase phase={7}>Settings editor, option sets, contacts, learning, countries, journal, decisions and ideas.</ComingInPhase>
    </>
  );
}

function Item({ k, v }: { k: string; v: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{k}</dt>
      <dd className="truncate">{v}</dd>
    </div>
  );
}
