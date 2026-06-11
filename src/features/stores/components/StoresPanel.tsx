import { Pencil } from "lucide-react";
import type { Store } from "../types/storeTypes";

export function StoresPanel({ onEdit, stores }: { onEdit?: (store: Store) => void; stores: Store[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {stores.map((store) => (
        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" key={store.id}>
          <div className="flex items-start justify-between gap-4">
            <div><p className="text-sm font-medium text-slate-500">{store.manager}</p><h3 className="mt-2 text-xl font-semibold text-slate-950">{store.name}</h3></div>
            <button aria-label="Editar loja" className="rounded-md border border-slate-200 p-2 text-slate-600 hover:bg-amber-50 hover:text-amber-800" onClick={() => onEdit?.(store)} title="Editar informações desta loja" type="button"><Pencil size={17} /></button>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-slate-500">Meta mensal</span>
              <strong className="mt-1 block text-slate-950">{store.monthlyGoal}</strong>
            </div>
            <div>
              <span className="text-slate-500">Saldo atual</span>
              <strong className="mt-1 block text-emerald-700">{store.balance}</strong>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
