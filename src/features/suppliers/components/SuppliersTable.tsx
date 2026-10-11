import { Pencil, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { DEFAULT_LIST_LIMIT, ListVisibilityToggle } from "@/components/ui/ListVisibilityToggle";
import { SortableHeader, type SortDirection } from "@/components/ui/SortableHeader";
import { parseBRL } from "@/lib/formatters/br";
import type { Supplier } from "../types/supplierTypes";

type SupplierSortKey = "document" | "name" | "openAmount" | "paymentMethod" | "status";

export function SuppliersTable({ onDelete, onEdit, suppliers }: { onDelete?: (supplier: Supplier) => void; onEdit?: (supplier: Supplier) => void; suppliers: Supplier[] }) {
  const [sort, setSort] = useState<{ direction: SortDirection; key: SupplierSortKey }>({ direction: "asc", key: "name" });
  const orderedSuppliers = useMemo(() => suppliers.toSorted((a, b) => {
    const left = sort.key === "openAmount" ? parseBRL(a.openAmount) : (a[sort.key] || "");
    const right = sort.key === "openAmount" ? parseBRL(b.openAmount) : (b[sort.key] || "");
    const comparison = typeof left === "number" && typeof right === "number" ? left - right : String(left).localeCompare(String(right), "pt-BR", { numeric: true, sensitivity: "base" });
    return sort.direction === "asc" ? comparison : -comparison;
  }), [sort, suppliers]);
  const [showAll, setShowAll] = useState(false);
  const visibleSuppliers = showAll ? orderedSuppliers : orderedSuppliers.slice(0, DEFAULT_LIST_LIMIT);
  const requestSort = (key: SupplierSortKey) => setSort((current) => ({ direction: current.key === key && current.direction === "asc" ? "desc" : "asc", key }));

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className={`space-y-3 p-3 lg:hidden ${showAll && orderedSuppliers.length > DEFAULT_LIST_LIMIT ? "max-h-[680px] overflow-y-auto" : ""}`}>
        {orderedSuppliers.length ? visibleSuppliers.map((supplier) => (
          <article className="rounded-lg border border-slate-200 p-4" key={supplier.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="break-words font-semibold text-slate-950">{supplier.name}</h3>
                <p className="mt-1 break-words text-xs text-slate-500">{supplier.document}</p>
              </div>
              <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">{supplier.status}</span>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div><dt className="text-xs text-slate-500">Em aberto</dt><dd className="mt-1 font-semibold text-slate-950">{supplier.openAmount}</dd></div>
              <div><dt className="text-xs text-slate-500">Pagamento</dt><dd className="mt-1 break-words text-slate-700">{supplier.paymentMethod || "Não informado"}</dd></div>
              <div><dt className="text-xs text-slate-500">Contato</dt><dd className="mt-1 break-words text-slate-700">{supplier.contactName || supplier.phone}</dd></div>
              <div><dt className="text-xs text-slate-500">Telefone</dt><dd className="mt-1 break-words text-slate-700">{supplier.contactName ? supplier.phone : "Não informado"}</dd></div>
            </dl>
            {supplier.email ? <p className="mt-3 break-words border-t border-slate-100 pt-3 text-xs text-slate-500">{supplier.email}</p> : null}
            {onEdit || onDelete ? (
              <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                {onEdit ? <button aria-label="Editar fornecedor" className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-amber-50 hover:text-amber-800" onClick={() => onEdit(supplier)} type="button"><Pencil size={14} />Editar</button> : null}
                {onDelete ? <button aria-label="Excluir fornecedor" className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50" onClick={() => onDelete(supplier)} type="button"><Trash2 size={14} />Excluir</button> : null}
              </div>
            ) : null}
          </article>
        )) : <p className="px-2 py-8 text-center text-sm text-slate-500">Nenhum fornecedor encontrado.</p>}
      </div>

      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-slate-50 text-slate-600"><tr><SortableHeader active={sort.key === "name"} direction={sort.direction} label="Fornecedor" onClick={() => requestSort("name")} className="px-5 py-3" /><SortableHeader active={sort.key === "document"} direction={sort.direction} label="CNPJ" onClick={() => requestSort("document")} className="px-5 py-3" /><th className="px-5 py-3 font-medium">Contato</th><SortableHeader active={sort.key === "openAmount"} direction={sort.direction} label="Em aberto" onClick={() => requestSort("openAmount")} className="px-5 py-3" /><SortableHeader active={sort.key === "paymentMethod"} direction={sort.direction} label="Pagamento" onClick={() => requestSort("paymentMethod")} className="px-5 py-3" /><SortableHeader active={sort.key === "status"} direction={sort.direction} label="Status" onClick={() => requestSort("status")} className="px-5 py-3" /><th className="px-5 py-3 font-medium">Ações</th></tr></thead>
          <tbody className="divide-y divide-slate-100">{orderedSuppliers.length ? visibleSuppliers.map((supplier) => <tr key={supplier.id}><td className="px-5 py-4 font-medium text-slate-950"><div>{supplier.name}</div>{supplier.email ? <div className="text-xs font-normal text-slate-500">{supplier.email}</div> : null}</td><td className="px-5 py-4 text-slate-700">{supplier.document}</td><td className="px-5 py-4 text-slate-700"><div>{supplier.contactName || supplier.phone}</div>{supplier.contactName ? <div className="text-xs text-slate-500">{supplier.phone}</div> : null}</td><td className="px-5 py-4 font-medium text-slate-950">{supplier.openAmount}</td><td className="px-5 py-4 text-slate-700">{supplier.paymentMethod || "Não informado"}</td><td className="px-5 py-4"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{supplier.status}</span></td><td className={`px-5 py-4 ${!onEdit && !onDelete ? "hidden" : ""}`}><div className="flex gap-2"><button aria-label="Editar fornecedor" className="rounded-md border border-slate-200 p-2 text-slate-600 hover:bg-amber-50 hover:text-amber-800" onClick={() => onEdit?.(supplier)} title="Editar cadastro deste fornecedor" type="button"><Pencil size={17} /></button><button aria-label="Excluir fornecedor" className="rounded-md border border-slate-200 p-2 text-rose-600 hover:bg-rose-50" onClick={() => onDelete?.(supplier)} title="Excluir fornecedor sem movimentações vinculadas" type="button"><Trash2 size={17} /></button></div></td></tr>) : <tr><td className="px-5 py-8 text-center text-slate-500" colSpan={7}>Nenhum fornecedor encontrado.</td></tr>}</tbody>
        </table>
      </div>
      <div className="px-3 pb-3 sm:px-5">
        <ListVisibilityToggle expanded={showAll} onToggle={() => setShowAll((current) => !current)} total={orderedSuppliers.length} />
      </div>
    </div>
  );
}
