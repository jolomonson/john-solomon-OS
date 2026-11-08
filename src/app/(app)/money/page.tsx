import { Suspense } from "react";
import { PageSkeleton } from "@/components/page-skeleton";
import type { Metadata } from "next";
import { ComingInPhase, PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/auth";
import { monthlySnapshotsRepo } from "@/lib/data/monthly-snapshots";
import { getSettings } from "@/lib/data/settings";
import { formatNGN, formatPct, formatUSD } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Money" };

/** Static shell; per-user data streams in behind Suspense (Cache Components). */
export default function MoneyPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <MoneyContent />
    </Suspense>
  );
}

async function MoneyContent() {
  const { db } = await requireUser();
  const [months, settings] = await Promise.all([monthlySnapshotsRepo.capitalMonthly(db), getSettings()]);
  const latest = [...months].reverse().find((m) => m.liquid_capital_ngn !== null);

  return (
    <>
      <PageHeader title="Money" description={`Stretch target ${formatUSD(settings.stretch_target_usd, { compact: true })} liquid · FX ₦${settings.fx_ngn_per_usd}/$`} />
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Stat label="Liquid capital" value={formatNGN(latest?.liquid_capital_ngn)} sub={formatUSD(latest?.liquid_capital_usd)} />
        <Stat label="Of $24M" value={formatPct(latest?.pct_stretch_target, 4)} />
        <Stat label="Net worth" value={formatNGN(latest?.net_worth_ngn)} sub={formatUSD(latest?.net_worth_usd)} />
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <table className="tabular w-full text-sm">
          <thead className="text-left text-xs text-muted-foreground">
            <tr className="border-b">
              <th className="px-3 py-2 font-medium">Month</th>
              <th className="px-3 py-2 font-medium">Q</th>
              <th className="px-3 py-2 text-right font-medium">Income</th>
              <th className="px-3 py-2 text-right font-medium">Liquid</th>
              <th className="px-3 py-2 text-right font-medium">USD</th>
            </tr>
          </thead>
          <tbody>
            {months.map((m) => (
              <tr key={m.month} className={cn("border-b last:border-0", m.is_future && "text-muted-foreground/60")}>
                <td className="px-3 py-1.5 font-mono text-xs">{m.month?.slice(0, 7)}</td>
                <td className="px-3 py-1.5 text-xs">{m.quarter}</td>
                <td className="px-3 py-1.5 text-right">{m.income_ngn ? formatNGN(m.income_ngn) : "—"}</td>
                <td className="px-3 py-1.5 text-right">
                  {formatNGN(m.liquid_capital_ngn)}
                  {m.is_carried_forward && <span className="ml-1 text-xs text-muted-foreground" title="Estimated: carried forward from an earlier snapshot">est.</span>}
                </td>
                <td className="px-3 py-1.5 text-right">{formatUSD(m.liquid_capital_usd)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4">
        <ComingInPhase phase={5}>Income/expense logging, snapshots, investments, equity and the capital chart.</ComingInPhase>
      </div>
    </>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="tabular mt-0.5 font-mono text-base font-semibold">{value}</p>
      {sub && <p className="tabular font-mono text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
