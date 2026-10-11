import { parseDateBR, todaySaoPaulo } from "@/lib/formatters/br";
import { SensitiveValue } from "@/components/ui/PrivacyContext";
import { SortableHeader, type SortDirection } from "@/components/ui/SortableHeader";
import { useMemo, useState } from "react";
import type { AccountPayable } from "@/features/accounts-payable/types/accountPayableTypes";

function statusLabel(account: AccountPayable) {
  if (account.status === "Pago") return "Pago";
  const today = todaySaoPaulo().getTime();
  const dueDate = parseDateBR(account.dueDate).getTime();
  if (dueDate < today) return "Atrasado";
  if (dueDate === today) return "Vence hoje";
  return "Aberto";
}

const statusStyles: Record<string, string> = {
  Aberto: "payment-status-open bg-slate-100 text-slate-700",
  Atrasado: "payment-status-late bg-rose-100 text-rose-800",
  Pago: "payment-status-paid bg-emerald-100 text-emerald-800",
  "Vence hoje": "payment-status-today bg-amber-100 text-amber-800",
};

export function PaymentsTable({ accounts }: { accounts: AccountPayable[] }) {
  const [sort, setSort] = useState<{ direction: SortDirection; key: "amount" | "dueDate" | "status" | "store" | "supplier" }>({ direction: "asc", key: "dueDate" });
  const payments = useMemo(() => accounts.filter((account) => account.status !== "Pago").toSorted((a, b) => {
    const left = sort.key === "dueDate" ? parseDateBR(a.dueDate).getTime() : sort.key === "amount" ? Number(a.amount.replace(/[^0-9,-]/g, "").replace(".", "").replace(",", ".")) : a[sort.key];
    const right = sort.key === "dueDate" ? parseDateBR(b.dueDate).getTime() : sort.key === "amount" ? Number(b.amount.replace(/[^0-9,-]/g, "").replace(".", "").replace(",", ".")) : b[sort.key];
    const comparison = typeof left === "number" && typeof right === "number" ? left - right : String(left).localeCompare(String(right), "pt-BR", { numeric: true, sensitivity: "base" });
    return sort.direction === "asc" ? comparison : -comparison;
  }).slice(0, 6), [accounts, sort]);
  const requestSort = (key: "amount" | "dueDate" | "status" | "store" | "supplier") => setSort((current) => ({ direction: current.key === key && current.direction === "asc" ? "desc" : "asc", key }));

  return (
    <div className="theme-surface overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="dashboard-panel-header border-b border-slate-200 px-5 py-4">
        <h2 className="text-base font-semibold text-slate-950">Próximos vencimentos</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead className="dashboard-table-head bg-slate-50 text-slate-600">
            <tr>
              <SortableHeader active={sort.key === "supplier"} direction={sort.direction} label="Fornecedor" onClick={() => requestSort("supplier")} className="px-5 py-3" />
              <SortableHeader active={sort.key === "store"} direction={sort.direction} label="Loja" onClick={() => requestSort("store")} className="px-5 py-3" />
              <SortableHeader active={sort.key === "dueDate"} direction={sort.direction} label="Vencimento" onClick={() => requestSort("dueDate")} className="px-5 py-3" />
              <SortableHeader active={sort.key === "amount"} direction={sort.direction} label="Valor" onClick={() => requestSort("amount")} className="px-5 py-3" />
              <SortableHeader active={sort.key === "status"} direction={sort.direction} label="Status" onClick={() => requestSort("status")} className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="dashboard-table-body divide-y divide-slate-100 text-slate-800">
            {payments.length ? (
              payments.map((payment) => {
                const status = statusLabel(payment);
                return (
                  <tr key={payment.id}>
                    <td className="px-5 py-4 font-medium text-slate-950">{payment.supplier}</td>
                    <td className="px-5 py-4">{payment.store}</td>
                    <td className="px-5 py-4">{payment.dueDate}</td>
                    <td className="px-5 py-4"><SensitiveValue value={payment.amount} /></td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[status]}`}>
                        {status}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td className="px-5 py-8 text-center text-slate-500" colSpan={5}>
                  Nenhum vencimento em aberto.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
