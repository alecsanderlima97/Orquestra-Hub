"use client";

import { ArrowUp, Calculator, Clock3, Delete, Divide, Equal, Minus, Pi, Plus, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

const buttons = ["sin", "cos", "tan", "sqrt", "log", "ln", "(", ")", "pi", "^", "7", "8", "9", "/", "C", "4", "5", "6", "*", "DEL", "1", "2", "3", "-", "=", "0", ".", "+"] as const;

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "medium" }).format(date);
}

function calculate(expression: string) {
  const normalized = expression
    .replaceAll("pi", "Math.PI")
    .replaceAll("^", "**")
    .replace(/\bsin\(/g, "Math.sin(")
    .replace(/\bcos\(/g, "Math.cos(")
    .replace(/\btan\(/g, "Math.tan(")
    .replace(/\bsqrt\(/g, "Math.sqrt(")
    .replace(/\blog\(/g, "Math.log10(")
    .replace(/\bln\(/g, "Math.log(");
  if (!/^[0-9+\-*/().\sMathPIlogsincotanqrte*]+$/.test(normalized)) throw new Error("Expressao invalida.");
  return Function(`"use strict"; return (${normalized})`)();
}

function ButtonIcon({ label }: { label: string }) {
  if (label === "+") return <Plus size={15} />;
  if (label === "-") return <Minus size={15} />;
  if (label === "*") return <X size={15} />;
  if (label === "/") return <Divide size={15} />;
  if (label === "=") return <Equal size={15} />;
  if (label === "DEL") return <Delete size={15} />;
  if (label === "pi") return <Pi size={15} />;
  return <span>{label}</span>;
}

export function UtilityDock() {
  const [now, setNow] = useState(() => new Date());
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [expression, setExpression] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const currentDateTime = useMemo(() => formatDateTime(now), [now]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!calculatorOpen) return;
    inputRef.current?.focus();
  }, [calculatorOpen]);

  function press(value: string) {
    setError("");
    if (value === "C") {
      setExpression("");
      return;
    }
    if (value === "DEL") {
      setExpression((item) => item.slice(0, -1));
      return;
    }
    if (value === "=") {
      try {
        const result = calculate(expression);
        setExpression(Number.isFinite(result) ? String(Number(result.toFixed(10))) : String(result));
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Erro no calculo.");
      }
      return;
    }
    const next = ["sin", "cos", "tan", "sqrt", "log", "ln"].includes(value) ? `${value}(` : value;
    setExpression((item) => `${item}${next}`);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      press("=");
    }
    if (event.key === "Escape") {
      event.preventDefault();
      setCalculatorOpen(false);
    }
  }

  return (
    <div className="fixed bottom-5 left-5 z-[105] flex flex-col items-start gap-2">
      {calculatorOpen ? (
        <section className="w-[min(22rem,calc(100vw-2.5rem))] rounded-lg border border-slate-200 bg-white p-3 shadow-2xl">
          <div className="mb-3 flex items-center justify-between">
            <strong className="text-sm text-slate-950">Calculadora cientifica</strong>
            <button className="rounded-md p-2 text-slate-500 hover:bg-slate-100" onClick={() => setCalculatorOpen(false)} title="Fechar calculadora" type="button"><X size={17} /></button>
          </div>
          <input
            ref={inputRef}
            className="mb-2 h-11 w-full rounded-md border border-slate-300 px-3 text-right font-mono text-sm"
            onChange={(event) => setExpression(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite: 2+2, sqrt(9), sin(pi/2)"
            value={expression}
          />
          {error ? <p className="mb-2 rounded-md bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">{error}</p> : null}
          <div className="grid grid-cols-5 gap-2">
            {buttons.map((item) => (
              <button className={`flex h-9 items-center justify-center rounded-md border text-xs font-semibold ${item === "=" ? "border-cyan-700 bg-cyan-700 text-white" : "border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100"}`} key={item} onClick={() => press(item)} type="button">
                <ButtonIcon label={item} />
              </button>
            ))}
          </div>
        </section>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-lg"><Clock3 size={15} />{currentDateTime}</span>
        <button className="flex size-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-700 shadow-lg hover:bg-slate-100" onClick={() => setCalculatorOpen((open) => !open)} title="Abrir calculadora cientifica" type="button"><Calculator size={18} /></button>
        <button className="flex size-8 items-center justify-center rounded-full border border-slate-200/80 bg-white/80 text-slate-500 shadow-sm backdrop-blur hover:bg-white hover:text-slate-900" onClick={() => window.scrollTo({ behavior: "smooth", top: 0 })} title="Subir ao topo" type="button"><ArrowUp size={14} /></button>
      </div>
    </div>
  );
}
