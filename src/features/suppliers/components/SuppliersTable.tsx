import { Pencil } from "lucide-react";
import type { Supplier } from "../types/supplierTypes";

export function SuppliersTable({ onEdit, suppliers }: { onEdit?: (supplier: Supplier) => void; suppliers: Supplier[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            <th className="px-5 py-3 font-medium">Fornecedor</th>
            <th className="px-5 py-3 font-medium">CNPJ</th>
            <th className="px-5 py-3 font-medium">Telefone</th>
            <th className="px-5 py-3 font-medium">Em aberto</th>
            <th className="px-5 py-3 font-medium">Status</th>
            <th className="px-5 py-3 font-medium">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {suppliers.length ? (
            suppliers.map((supplier) => (
              <tr key={supplier.id}>
                <td className="px-5 py-4 font-medium text-slate-950">{supplier.name}</td>
                <td className="px-5 py-4 text-slate-700">{supplier.document}</td>
                <td className="px-5 py-4 text-slate-700">{supplier.phone}</td>
                <td className="px-5 py-4 font-medium text-slate-950">{supplier.openAmount}</td>
                <td className="px-5 py-4">
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {supplier.status}
                  </span>
                </td>
                <td className="px-5 py-4"><button aria-label="Editar fornecedor" className="rounded-md border border-slate-200 p-2 text-slate-600 hover:bg-amber-50 hover:text-amber-800" onClick={() => onEdit?.(supplier)} title="Editar cadastro deste fornecedor" type="button"><Pencil size={17} /></button></td>
              </tr>
            ))
          ) : (
            <tr>
              <td className="px-5 py-8 text-center text-slate-500" colSpan={6}>
                Nenhum fornecedor encontrado.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
