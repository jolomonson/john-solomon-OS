import type { Attention } from "@/lib/schemas/portfolio";

/** Attention colour language: active red · maintenance amber · parked grey · partnership purple · work blue · killed dark grey + strikethrough. */
export const ATTENTION_STYLE: Record<Attention, { label: string; dot: string; badge: string; text?: string }> = {
  active: { label: "Active", dot: "bg-att-active", badge: "border-att-active/30 bg-att-active/10 text-att-active" },
  maintenance: { label: "Maintenance", dot: "bg-att-maintenance", badge: "border-att-maintenance/30 bg-att-maintenance/10 text-att-maintenance" },
  parked: { label: "Parked", dot: "bg-att-parked", badge: "border-att-parked/30 bg-att-parked/10 text-att-parked" },
  partnership: { label: "Partnership", dot: "bg-att-partnership", badge: "border-att-partnership/30 bg-att-partnership/10 text-att-partnership" },
  work: { label: "Work", dot: "bg-att-work", badge: "border-att-work/30 bg-att-work/10 text-att-work" },
  killed: { label: "Killed", dot: "bg-att-killed", badge: "border-att-killed/30 bg-att-killed/10 text-att-killed", text: "line-through text-att-killed" },
};

export const ATTENTION_ORDER: Attention[] = ["active", "maintenance", "parked", "partnership", "work", "killed"];
