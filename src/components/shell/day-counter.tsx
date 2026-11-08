"use client";

import { useEffect, useState } from "react";
import { programClock, type ClockSettings, type ProgramClock } from "@/lib/dates";

/**
 * "Day X of 365 · N days left". First paint uses the clock computed on the
 * server (in settings.timezone), so there's no hydration mismatch. It then
 * re-computes every minute so it rolls over at Lagos midnight while open.
 */
export function DayCounter({ settings, initial }: { settings: ClockSettings; initial: ProgramClock }) {
  const [clock, setClock] = useState(initial);

  useEffect(() => {
    const tick = () => setClock(programClock(settings));
    const id = window.setInterval(tick, 60_000);
    const onVisible = () => document.visibilityState === "visible" && tick();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [settings]);

  return (
    <p className="tabular font-mono text-xs text-muted-foreground sm:text-sm" data-testid="day-counter">
      {formatClock(clock)}
    </p>
  );
}

export function formatClock(c: ProgramClock): string {
  if (c.phase === "before") return `Starts in ${c.daysUntilStart} day${c.daysUntilStart === 1 ? "" : "s"}`;
  if (c.phase === "ended") return `Day ${c.totalDays} of ${c.totalDays} · Complete`;
  return `Day ${c.day} of ${c.totalDays} · ${c.daysLeft} day${c.daysLeft === 1 ? "" : "s"} left`;
}
