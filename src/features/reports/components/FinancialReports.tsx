import type { AccountPayable } from "@/features/accounts-payable/types/accountPayableTypes";
import type { Purchase } from "@/features/purchases/types/purchaseTypes";
import { parseBRL } from "@/lib/formatters/br";

const money = new Intl.NumberFormat("pt-BR", { currency: "BRL", style: "currency" });

function groupOpenAmount(accounts: AccountPayable[], key: "store" | "supplier") {
  const grouped = accounts
    .filter((account) => account.status !== "Pago")
    .reduce<Record<string, number>>((result, account) => {
      result[account[key]] = (result[account[key]] || 0) + parseBRL(account.amount);
      return result;
    }, {});

  return Object.entries(grouped)
    .map(([name, amount]) => ({ amount, name }))
    .toSorted((a, b) => b.amount - a.amount);
}

export function FinancialReports({
  accounts,
  purchases,
}: {
  accounts: AccountPayable[];
  purchases: Purchase[];
}) {
  const openByStore = groupOpenAmount(accounts, "store");
  const openBySupplier = groupOpenAmount(accounts, "supplier");
  const paidCount = accounts.filter((account) => account.status === "Pago").length;
  const receiptCount = accounts.filter((account) => account.receiptName).length;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-4">
        <ReportCard label="Compras lançadas" value={String(purchases.length)} />
        <ReportCard label="Boletos pagos" value={String(paidCount)} />
        <ReportCard label="Com comprovante" value={String(receiptCount)} />
        <ReportCard label="Maior fornecedor" value={openBySupplier[0]?.name || "Sem saldo"} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ReportList items={openByStore} title="Saldo em aberto por loja" />
        <ReportList items={openBySupplier} title="Saldo em aberto por fornecedor" />
      </div>
    </div>
  );
}

function ReportCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <strong className="mt-2 block text-xl text-slate-950">{value}</strong>
    </article>
  );
}

function ReportList({ items, title }: { items: { amount: number; name: string }[]; title: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <h3 className="text-base font-semibold text-slate-950">{title}</h3>
      </div>
      <div className="divide-y divide-slate-100">
        {items.length ? (
          items.map((item) => (
            <div className="flex items-center justify-between gap-4 px-5 py-4 text-sm" key={item.name}>
              <span className="font-medium text-slate-800">{item.name}</span>
              <strong className="text-slate-950">{money.format(item.amount)}</strong>
            </div>
          ))
        ) : (
          <p className="px-5 py-6 text-sm text-slate-500">Nenhum saldo em aberto.</p>
        )}
      </div>
    </div>
  );
}
