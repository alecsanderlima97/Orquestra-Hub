import type { FinancialSummary } from "../types/dashboardTypes";

const toneStyles: Record<FinancialSummary["tone"], string> = {
  neutral: "border-slate-200 bg-white text-slate-900 before:bg-cyan-500",
  success: "border-emerald-200 bg-white text-emerald-950 before:bg-emerald-500",
  danger: "border-rose-200 bg-white text-rose-950 before:bg-rose-500",
  warning: "border-amber-200 bg-white text-amber-950 before:bg-amber-400",
};

export function SummaryCard({ item }: { item: FinancialSummary }) {
  return (
    <article className={`executive-card relative overflow-hidden rounded-lg border p-5 before:absolute before:left-0 before:top-0 before:h-full before:w-1 ${toneStyles[item.tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{item.label}</p>
      <strong className="mt-3 block text-3xl font-semibold tracking-tight">{item.value}</strong>
      <span className="mt-3 block text-sm leading-5 text-slate-600">{item.helper}</span>
    </article>
  );
}
