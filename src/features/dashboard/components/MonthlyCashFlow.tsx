import type { AccountPayable } from "@/features/accounts-payable/types/accountPayableTypes";
import { parseBRL } from "@/lib/formatters/br";

const money = new Intl.NumberFormat("pt-BR", { currency: "BRL", style: "currency" });

export function MonthlyCashFlow({ accounts }: { accounts: AccountPayable[] }) {
  const months = accounts.reduce<Record<string, { open: number; paid: number }>>((result, item) => {
    const [, month, year] = item.dueDate.split("/");
    const key = `${month}/${year}`;
    result[key] ||= { open: 0, paid: 0 };
    result[key][item.status === "Pago" ? "paid" : "open"] += parseBRL(item.amount);
    return result;
  }, {});
  const rows = Object.entries(months)
    .toSorted(([a], [b]) => {
      const [monthA, yearA] = a.split("/").map(Number);
      const [monthB, yearB] = b.split("/").map(Number);
      return new Date(yearA, monthA - 1).getTime() - new Date(yearB, monthB - 1).getTime();
    })
    .slice(-6);

  return (
    <div className="theme-surface mt-6 rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="dashboard-panel-header border-b border-slate-200 px-5 py-4">
        <h3 className="font-semibold">Fluxo de caixa mensal</h3>
        <p className="mt-1 text-sm text-slate-500">Comparacao entre valores pagos e compromissos em aberto.</p>
      </div>
      <div className="max-h-[320px] overflow-y-auto p-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {rows.map(([month, values]) => (
          <article className="dashboard-subcard rounded-md border border-slate-200 p-4" key={month}>
            <strong>{month}</strong>
            <div className="mt-3 flex justify-between text-sm">
              <span className="dashboard-paid text-emerald-700">Pago: {money.format(values.paid)}</span>
              <span className="dashboard-open text-amber-800">Aberto: {money.format(values.open)}</span>
            </div>
          </article>
        ))}
        </div>
      </div>
    </div>
  );
}
