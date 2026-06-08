import { CheckCircle2, Paperclip } from "lucide-react";
import type { AccountPayable } from "../types/accountPayableTypes";

const statusStyles: Record<AccountPayable["status"], string> = {
  Aberto: "bg-amber-100 text-amber-800",
  Atrasado: "bg-rose-100 text-rose-800",
  Pago: "bg-emerald-100 text-emerald-800",
};

export function AccountsPayableTable({
  accounts,
  onMarkPaid,
}: {
  accounts: AccountPayable[];
  onMarkPaid?: (id: string) => void;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[860px] text-left text-sm">
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            <th className="px-5 py-3 font-medium">Fornecedor</th>
            <th className="px-5 py-3 font-medium">Loja</th>
            <th className="px-5 py-3 font-medium">Parcela</th>
            <th className="px-5 py-3 font-medium">Vencimento</th>
            <th className="px-5 py-3 font-medium">Valor</th>
            <th className="px-5 py-3 font-medium">Status</th>
            <th className="px-5 py-3 font-medium">Acoes</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {accounts.map((account) => (
            <tr key={account.id}>
              <td className="px-5 py-4 font-medium text-slate-950">{account.supplier}</td>
              <td className="px-5 py-4 text-slate-700">{account.store}</td>
              <td className="px-5 py-4 text-slate-700">{account.installment}</td>
              <td className="px-5 py-4 text-slate-700">{account.dueDate}</td>
              <td className="px-5 py-4 font-medium text-slate-950">{account.amount}</td>
              <td className="px-5 py-4">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[account.status]}`}>
                  {account.status}
                </span>
              </td>
              <td className="px-5 py-4">
                <div className="flex gap-2">
                  <button
                    aria-label="Dar baixa"
                    className="rounded-md border border-slate-200 p-2 text-slate-700 hover:bg-slate-100"
                    onClick={() => onMarkPaid?.(account.id)}
                    type="button"
                  >
                    <CheckCircle2 size={17} />
                  </button>
                  <button
                    aria-label="Anexar comprovante"
                    className="rounded-md border border-slate-200 p-2 text-slate-700 hover:bg-slate-100"
                    type="button"
                  >
                    <Paperclip size={17} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
