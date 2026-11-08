/**
 * Core rules, as pure functions shared by UI (instant feedback) and server.
 * The database enforces the same rules (triggers) — these mirror them.
 */
import type { Attention } from "@/lib/schemas/portfolio";

export type TaskKind = "signal" | "noise";

/** Default task kind from its asset: active → signal; any other attention → noise; no asset → signal. */
export function defaultTaskKind(assetAttention: Attention | null | undefined): TaskKind {
  if (!assetAttention) return "signal";
  return assetAttention === "active" ? "signal" : "noise";
}

/** Warn (don't block) above this many open tasks for one asset in a week. */
export const MAX_OPEN_TASKS_PER_ASSET_WEEK = 7;

export type Balances = {
  cash_ngn?: number | null;
  liquid_investments_ngn?: number | null;
  illiquid_investments_ngn?: number | null;
  business_equity_ngn?: number | null;
  other_assets_ngn?: number | null;
  liabilities_ngn?: number | null;
};

const n = (v: number | null | undefined) => v ?? 0;

/** liquid_capital = cash + liquid_investments. Business equity is never liquid. */
export function liquidCapitalNgn(b: Balances): number {
  return n(b.cash_ngn) + n(b.liquid_investments_ngn);
}

/** net_worth = cash + all_investments + business_equity + other_assets − liabilities. */
export function netWorthNgn(b: Balances): number {
  return (
    n(b.cash_ngn) +
    n(b.liquid_investments_ngn) +
    n(b.illiquid_investments_ngn) +
    n(b.business_equity_ngn) +
    n(b.other_assets_ngn) -
    n(b.liabilities_ngn)
  );
}

/** USD is always NGN ÷ FX (NGN per USD). */
export function ngnToUsd(ngn: number, fxNgnPerUsd: number): number {
  if (!(fxNgnPerUsd > 0)) throw new Error("FX rate must be > 0");
  return ngn / fxNgnPerUsd;
}

/** NGN value of an amount in its original currency; mirrors money_before_write(). */
export function toNgn(amount: number, currency: "NGN" | "USD" | "GBP" | "EUR", fxUsed: number | null): number {
  if (currency === "NGN") return amount;
  if (!fxUsed || fxUsed <= 0) throw new Error(`FX rate required for ${currency}`);
  return Math.round(amount * fxUsed * 100) / 100;
}

/** clamp((current − baseline)/(target − baseline), 0, 1); null without a target. Mirrors v_goal_progress. */
export function goalProgress(g: { baseline: number | null; current: number | null; target: number | null }): number | null {
  if (g.target === null) return null;
  const base = g.baseline ?? 0;
  const cur = g.current ?? base;
  if (g.target === base) return cur >= g.target ? 1 : 0;
  return Math.min(1, Math.max(0, (cur - base) / (g.target - base)));
}
