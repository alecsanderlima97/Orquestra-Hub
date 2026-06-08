import type { UpcomingPayment } from "../types/dashboardTypes";

const statusStyles: Record<UpcomingPayment["status"], string> = {
  Aberto: "bg-slate-100 text-slate-700",
  "Vence hoje": "bg-amber-100 text-amber-800",
  Atrasado: "bg-rose-100 text-rose-800",
};

export function PaymentsTable({ payments }: { payments: UpcomingPayment[] }) {
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
            {payments.map((payment) => (
              <tr key={`${payment.supplier}-${payment.dueDate}`}>
                <td className="px-5 py-4 font-medium text-slate-950">{payment.supplier}</td>
                <td className="px-5 py-4">{payment.store}</td>
                <td className="px-5 py-4">{payment.dueDate}</td>
                <td className="px-5 py-4">{payment.amount}</td>
                <td className="px-5 py-4">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[payment.status]}`}>
                    {payment.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
