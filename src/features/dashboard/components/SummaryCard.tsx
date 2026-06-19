import type { FinancialSummary } from "../types/dashboardTypes";

const toneStyles: Record<FinancialSummary["tone"], string> = {
  neutral: "border-slate-200 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-50",
  success: "border-emerald-200 bg-emerald-50 text-emerald-950 dark:border-emerald-700 dark:bg-emerald-950/35 dark:text-emerald-50",
  danger: "border-rose-200 bg-rose-50 text-rose-950 dark:border-rose-700 dark:bg-rose-950/35 dark:text-rose-50",
  warning: "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-700 dark:bg-amber-950/35 dark:text-amber-50",
};

export function SummaryCard({ item }: { item: FinancialSummary }) {
  return (
    <article className={`rounded-lg border p-5 shadow-sm ${toneStyles[item.tone]}`}>
      <p className="text-sm font-medium text-slate-600">{item.label}</p>
      <strong className="mt-3 block text-2xl font-semibold">{item.value}</strong>
      <span className="mt-2 block text-sm text-slate-600">{item.helper}</span>
    </article>
  );
}
