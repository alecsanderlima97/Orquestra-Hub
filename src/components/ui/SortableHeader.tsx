import { ArrowDownUp, ChevronDown, ChevronUp } from "lucide-react";

export type SortDirection = "asc" | "desc";

export function SortableHeader({
  active,
  className = "",
  direction,
  label,
  onClick,
}: {
  active: boolean;
  className?: string;
  direction: SortDirection;
  label: string;
  onClick: () => void;
}) {
  return (
    <th aria-sort={active ? direction === "asc" ? "ascending" : "descending" : "none"} className={className}>
      <button aria-label={`Ordenar por ${label}`} className="inline-flex items-center gap-1.5 text-left font-medium hover:text-cyan-800" onClick={onClick} title={`Ordenar por ${label}`} type="button">
        {label}
        {active ? direction === "asc" ? <ChevronUp size={15} /> : <ChevronDown size={15} /> : <ArrowDownUp className="text-slate-400" size={14} />}
      </button>
    </th>
  );
}
