import type { Purchase } from "../types/purchaseTypes";

export function PurchasesTable({ purchases }: { purchases: Purchase[] }) {
  return (
    <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <h3 className="text-base font-semibold text-slate-950">Notas lançadas</h3>
      </div>
      <table className="w-full min-w-[780px] text-left text-sm">
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            <th className="px-5 py-3 font-medium">Nota</th>
            <th className="px-5 py-3 font-medium">Fornecedor</th>
            <th className="px-5 py-3 font-medium">Loja</th>
            <th className="px-5 py-3 font-medium">Data</th>
            <th className="px-5 py-3 font-medium">Valor</th>
            <th className="px-5 py-3 font-medium">Parcelas</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {purchases.length ? (
            purchases.map((purchase) => (
              <tr key={purchase.id}>
                <td className="px-5 py-4 font-medium text-slate-950">{purchase.invoiceNumber}</td>
                <td className="px-5 py-4 text-slate-700">{purchase.supplier}</td>
                <td className="px-5 py-4 text-slate-700">{purchase.store}</td>
                <td className="px-5 py-4 text-slate-700">{purchase.issueDate}</td>
                <td className="px-5 py-4 font-medium text-slate-950">{purchase.total}</td>
                <td className="px-5 py-4 text-slate-700">{purchase.installments}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td className="px-5 py-8 text-center text-slate-500" colSpan={6}>
                Nenhuma nota lançada ainda.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
