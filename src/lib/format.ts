/** Currency + number formatting. ₦ with thousands separators; $ with 2 decimals for small amounts. */

const ngnFmt = new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 });
const ngnFmt2 = new Intl.NumberFormat("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const usd2 = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const usd0 = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 2 });

function sign(v: number) {
  return v < 0 ? "−" : "";
}

/** ₦27,000 · ₦1,234.50 when there are kobo. */
export function formatNGN(value: number | null | undefined, opts: { kobo?: boolean } = {}): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  const abs = Math.abs(value);
  const hasKobo = opts.kobo ?? Math.round(abs * 100) % 100 !== 0;
  return `${sign(value)}₦${(hasKobo ? ngnFmt2 : ngnFmt).format(abs)}`;
}

/** $18.62 below $10,000; $24,000,000 above; `compact` gives $24M. */
export function formatUSD(value: number | null | undefined, opts: { compact?: boolean } = {}): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  const abs = Math.abs(value);
  if (opts.compact && abs >= 10_000) return `${sign(value)}$${compact.format(abs)}`;
  return `${sign(value)}$${(abs < 10_000 ? usd2 : usd0).format(abs)}`;
}

export function formatPct(value: number | null | undefined, digits = 0): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  // tiny progress (e.g. $18 of $24M) should not read as 0%
  if (value > 0 && value * 100 < 10 ** -digits) return `<${(10 ** -digits).toFixed(digits)}%`;
  return `${(value * 100).toFixed(digits)}%`;
}
