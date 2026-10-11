"use client";

import { ChevronDown, ChevronUp } from "lucide-react";

export const DEFAULT_LIST_LIMIT = 8;

export function ListVisibilityToggle({
  expanded,
  limit = DEFAULT_LIST_LIMIT,
  onToggle,
  total,
}: {
  expanded: boolean;
  limit?: number;
  onToggle: () => void;
  total: number;
}) {
  if (total <= limit) return null;

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-cyan-100 pt-3">
      <span className="text-xs text-slate-500">
        {expanded ? `Exibindo todos os ${total} itens` : `Exibindo ${limit} de ${total} itens`}
      </span>
      <button
        aria-expanded={expanded}
        className="inline-flex items-center gap-2 rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-800 transition hover:border-cyan-300 hover:bg-cyan-100"
        onClick={onToggle}
        type="button"
      >
        {expanded ? "Ocultar" : `Ver mais (${total - limit})`}
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
    </div>
  );
}
