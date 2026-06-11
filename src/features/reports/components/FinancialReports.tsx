import { Printer } from "lucide-react";
import type { AccountPayable } from "@/features/accounts-payable/types/accountPayableTypes";
import type { Purchase } from "@/features/purchases/types/purchaseTypes";
import { compareDateBR, parseBRL } from "@/lib/formatters/br";

const money = new Intl.NumberFormat("pt-BR", { currency: "BRL", style: "currency" });
function total(items: AccountPayable[]) { return items.reduce((sum, item) => sum + parseBRL(item.amount), 0); }
function group(accounts: AccountPayable[], key: "store" | "supplier") {
  const data = accounts.reduce<Record<string, { open: number; overdue: number; paid: number; count: number }>>((result, account) => {
    const item = result[account[key]] || { open: 0, overdue: 0, paid: 0, count: 0 };
    const amount = parseBRL(account.amount); item.count += 1;
    if (account.status === "Pago") item.paid += amount; else item.open += amount;
    if (account.status === "Atrasado") item.overdue += amount;
    result[account[key]] = item; return result;
  }, {});
  return Object.entries(data).map(([name, values]) => ({ name, ...values })).toSorted((a, b) => b.open - a.open);
}

export function FinancialReports({ accounts, purchases }: { accounts: AccountPayable[]; purchases: Purchase[] }) {
  const paid = accounts.filter((item) => item.status === "Pago");
  const open = accounts.filter((item) => item.status !== "Pago");
  const overdue = accounts.filter((item) => item.status === "Atrasado");
  const byStore = group(accounts, "store"); const bySupplier = group(accounts, "supplier");
  const upcoming = open.toSorted((a, b) => compareDateBR(a.dueDate, b.dueDate)).slice(0, 10);

  return (
    <div className="space-y-5" id="printable-reports">
      <div className="no-print flex justify-end"><button className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800" onClick={() => window.print()} title="Imprimir ou salvar este relatório em PDF" type="button"><Printer size={17} />Imprimir relatório</button></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <ReportCard label="Compras lançadas" value={String(purchases.length)} helper={money.format(purchases.reduce((sum, item) => sum + parseBRL(item.total), 0))} />
        <ReportCard label="Total em aberto" value={money.format(total(open))} helper={`${open.length} conta(s)`} />
        <ReportCard label="Total pago" value={money.format(total(paid))} helper={`${paid.length} baixa(s)`} />
        <ReportCard label="Total atrasado" value={money.format(total(overdue))} helper={`${overdue.length} vencida(s)`} />
        <ReportCard label="Com comprovante" value={String(accounts.filter((item) => item.receiptName).length)} helper="Pagamentos documentados" />
      </div>
      <div className="grid gap-5 xl:grid-cols-2"><Breakdown title="Detalhamento por loja" items={byStore} /><Breakdown title="Detalhamento por fornecedor" items={bySupplier} /></div>
      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-4"><h3 className="font-semibold">Próximos vencimentos e pendências</h3></div>
        <table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-slate-600"><tr><th className="px-5 py-3">Fornecedor</th><th className="px-5 py-3">Loja</th><th className="px-5 py-3">Vencimento</th><th className="px-5 py-3">Valor</th><th className="px-5 py-3">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{upcoming.map((item) => <tr key={item.id}><td className="px-5 py-3 font-medium">{item.supplier}</td><td className="px-5 py-3">{item.store}</td><td className="px-5 py-3">{item.dueDate}</td><td className="px-5 py-3 font-medium">{item.amount}</td><td className="px-5 py-3">{item.status}</td></tr>)}</tbody></table>
      </div>
    </div>
  );
}
function ReportCard({ label, value, helper }: { label: string; value: string; helper: string }) { return <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{label}</p><strong className="mt-2 block text-xl">{value}</strong><span className="mt-1 block text-xs text-slate-500">{helper}</span></article>; }
function Breakdown({ items, title }: { items: { name: string; open: number; overdue: number; paid: number; count: number }[]; title: string }) { return <div className="rounded-lg border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 px-5 py-4"><h3 className="font-semibold">{title}</h3></div><div className="divide-y divide-slate-100">{items.map((item) => <div className="px-5 py-4" key={item.name}><div className="flex justify-between gap-4"><strong>{item.name}</strong><span className="text-sm text-slate-500">{item.count} conta(s)</span></div><div className="mt-2 grid grid-cols-3 gap-2 text-xs"><span>Aberto: <b>{money.format(item.open)}</b></span><span>Pago: <b>{money.format(item.paid)}</b></span><span>Atrasado: <b className="text-rose-700">{money.format(item.overdue)}</b></span></div></div>)}</div></div>; }
