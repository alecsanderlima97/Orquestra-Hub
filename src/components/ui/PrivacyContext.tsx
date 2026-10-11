"use client";

import { Eye, EyeOff } from "lucide-react";
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type PrivacyContextValue = {
  hidden: boolean;
  toggle: () => void;
};

const PrivacyContext = createContext<PrivacyContextValue>({ hidden: false, toggle: () => undefined });

export function PrivacyProvider({ children }: { children: ReactNode }) {
  const [hidden, setHidden] = useState(false);
  const value = useMemo(() => ({ hidden, toggle: () => setHidden((current) => !current) }), [hidden]);

  return <PrivacyContext.Provider value={value}>{children}</PrivacyContext.Provider>;
}

export function SensitiveValue({ className = "", showToggle = true, value }: { className?: string; showToggle?: boolean; value: string }) {
  const { hidden, toggle } = useContext(PrivacyContext);
  const label = hidden ? "Mostrar valores financeiros" : "Ocultar valores financeiros";

  return (
    <span className={`inline-flex max-w-full items-center gap-1.5 ${className}`}>
      <span aria-label={hidden ? "Valor oculto" : value} className={hidden ? "tracking-[0.18em]" : "break-words"}>{hidden ? "••••••" : value}</span>
      {showToggle ? <button aria-label={label} aria-pressed={hidden} className="inline-flex size-7 shrink-0 items-center justify-center rounded-md border border-cyan-200 bg-cyan-50 text-cyan-700 transition hover:border-cyan-300 hover:bg-cyan-100" onClick={toggle} title={label} type="button">
        {hidden ? <EyeOff size={15} /> : <Eye size={15} />}
      </button> : null}
    </span>
  );
}
