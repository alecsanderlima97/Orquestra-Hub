"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { TextField } from "@/components/ui/TextField";
import { toTitleCaseBR } from "@/lib/formatters/br";
import type { FinancialCategory } from "../types/financialCategoryTypes";

const colors = ["#0891b2", "#16a34a", "#f59e0b", "#dc2626", "#7c3aed", "#475569"];

export function FinancialCategoriesPanel({
  canWrite,
  categories,
  error,
  onCreate,
}: {
  canWrite: boolean;
  categories: FinancialCategory[];
  error?: string;
  onCreate: (category: Omit<FinancialCategory, "id">) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(colors[0]);

  async function submit() {
    const finalName = toTitleCaseBR(name.trim());
    if (!finalName) return;
    await onCreate({ active: true, color, name: finalName });
    setName("");
    setColor(colors[0]);
  }

  return (
    <section className="theme-surface rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="font-semibold">Categorias financeiras</h3>
          <p className="theme-muted mt-1 text-sm text-slate-600">Classifique boletos, despesas e relatórios por grupo financeiro.</p>
        </div>
      </div>
      {canWrite ? (
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <TextField label="Nova categoria" onBlur={() => setName(toTitleCaseBR(name))} onChange={(event) => setName(event.target.value)} placeholder="Ex.: Impostos" value={name} />
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Cor</span>
            <select className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm" onChange={(event) => setColor(event.target.value)} value={color}>
              {colors.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <button className="mt-7 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800" onClick={submit} type="button">
            <Plus size={17} />
            Criar categoria
          </button>
        </div>
      ) : null}
      {error ? <p className="mt-3 text-sm text-rose-600">{error}</p> : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {categories.length ? categories.map((item) => (
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-medium text-slate-700" key={item.id}>
            <span className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} />
            {item.name}
          </span>
        )) : <p className="text-sm text-slate-500">Nenhuma categoria cadastrada ainda.</p>}
      </div>
    </section>
  );
}
