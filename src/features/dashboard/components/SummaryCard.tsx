import type { FinancialSummary } from "../types/dashboardTypes";

const toneStyles: Record<FinancialSummary["tone"], string> = {
  neutral: "dashboard-card-neutral border-slate-200 bg-white text-slate-900",
  success: "dashboard-card-success border-emerald-200 bg-emerald-50 text-emerald-950",
  danger: "dashboard-card-danger border-rose-200 bg-rose-50 text-rose-950",
  warning: "dashboard-card-warning border-amber-200 bg-amber-50 text-amber-950",
};

export function SummaryCard({ item }: { item: FinancialSummary }) {
  return (
    <article className={`rounded-lg border p-5 shadow-sm ${toneStyles[item.tone]}`} title={item.tooltip || `${item.label}: ${item.helper}`}>
      <p className="text-sm font-medium text-slate-600">{item.label}</p>
      <strong className="mt-3 block text-2xl font-semibold">{item.value}</strong>
      <span className="mt-2 block text-sm text-slate-600">{item.helper}</span>
    </article>
  );
}
