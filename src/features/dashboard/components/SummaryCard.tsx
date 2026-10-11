import type { FinancialSummary } from "../types/dashboardTypes";
import { SensitiveValue } from "@/components/ui/PrivacyContext";

const toneStyles: Record<FinancialSummary["tone"], string> = {
  neutral: "dashboard-card-neutral border-slate-200 bg-white text-slate-900",
  success: "dashboard-card-success border-emerald-200 bg-emerald-50 text-emerald-950",
  danger: "dashboard-card-danger border-rose-200 bg-rose-50 text-rose-950",
  warning: "dashboard-card-warning border-amber-200 bg-amber-50 text-amber-950",
};

export function SummaryCard({ item }: { item: FinancialSummary }) {
  return (
    <article className={`motion-card min-w-0 rounded-lg border p-4 shadow-sm sm:min-h-[128px] sm:p-5 ${toneStyles[item.tone]}`} title={item.tooltip || `${item.label}: ${item.helper}`}>
      <p className="break-words text-sm font-medium text-slate-600">{item.label}</p>
      <strong className="mt-2 block text-lg font-semibold sm:text-xl"><SensitiveValue className="whitespace-nowrap" value={item.value} /></strong>
      <span className="mt-2 block break-words text-sm text-slate-600">{item.helper}</span>
    </article>
  );
}
