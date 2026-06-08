import { parseDateBR, todaySaoPaulo } from "@/lib/formatters/br";
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
  Aberto: "bg-slate-100 text-slate-700",
  Atrasado: "bg-rose-100 text-rose-800",
  Pago: "bg-emerald-100 text-emerald-800",
  "Vence hoje": "bg-amber-100 text-amber-800",
};

export function PaymentsTable({ accounts }: { accounts: AccountPayable[] }) {
  const payments = accounts.filter((account) => account.status !== "Pago").slice(0, 6);

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-base font-semibold text-slate-950">Próximos vencimentos</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-5 py-3 font-medium">Fornecedor</th>
              <th className="px-5 py-3 font-medium">Loja</th>
              <th className="px-5 py-3 font-medium">Vencimento</th>
              <th className="px-5 py-3 font-medium">Valor</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-800">
            {payments.length ? (
              payments.map((payment) => {
                const status = statusLabel(payment);
                return (
                  <tr key={payment.id}>
                    <td className="px-5 py-4 font-medium text-slate-950">{payment.supplier}</td>
                    <td className="px-5 py-4">{payment.store}</td>
                    <td className="px-5 py-4">{payment.dueDate}</td>
                    <td className="px-5 py-4">{payment.amount}</td>
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
