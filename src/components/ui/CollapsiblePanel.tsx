"use client";

import { ChevronDown } from "lucide-react";
import { useState, type ReactNode } from "react";

export function CollapsiblePanel({
  children,
  defaultOpen = false,
  description,
  eyebrow = "Detalhes",
  storageKey,
  title,
}: {
  children: ReactNode;
  defaultOpen?: boolean;
  description: string;
  eyebrow?: string;
  storageKey?: string;
  title: string;
}) {
  const [open, setOpen] = useState(() => {
    if (typeof window === "undefined" || !storageKey) return defaultOpen;
    const saved = window.localStorage.getItem(storageKey);
    return saved ? saved === "open" : defaultOpen;
  });

  return (
    <details
      className="theme-surface group overflow-hidden rounded-lg border border-cyan-200/80 bg-white shadow-[0_0_18px_rgba(34,211,238,0.16)]"
      onToggle={(event) => {
        const next = event.currentTarget.open;
        setOpen(next);
        if (storageKey) window.localStorage.setItem(storageKey, next ? "open" : "closed");
      }}
      open={open}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 outline-none transition hover:bg-cyan-50/60 focus-visible:ring-2 focus-visible:ring-cyan-500 sm:px-5 [&::-webkit-details-marker]:hidden">
        <span className="min-w-0">
          <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-700">{eyebrow}</span>
          <strong className="mt-1 block text-base text-slate-950">{title}</strong>
          <span className="mt-1 block text-sm text-slate-500">{description}</span>
        </span>
        <span className="flex shrink-0 items-center gap-2 text-xs font-semibold text-cyan-700">
          <span className="hidden sm:inline">{open ? "Ocultar" : "Mostrar"}</span>
          <ChevronDown className="transition-transform group-open:rotate-180" size={20} />
        </span>
      </summary>
      <div className="border-t border-cyan-100 p-4 sm:p-5">{children}</div>
    </details>
  );
}
