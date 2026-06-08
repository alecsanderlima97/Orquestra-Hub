import type { Store } from "../types/storeTypes";

export function StoresPanel({ stores }: { stores: Store[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {stores.map((store) => (
        <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" key={store.id}>
          <p className="text-sm font-medium text-slate-500">{store.manager}</p>
          <h3 className="mt-2 text-xl font-semibold text-slate-950">{store.name}</h3>
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
