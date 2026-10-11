import { FileText, Paperclip, Pencil, Trash2, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { SortableHeader, type SortDirection } from "@/components/ui/SortableHeader";
import { parseBRL, parseDateBR } from "@/lib/formatters/br";
import type { Purchase } from "../types/purchaseTypes";

type Props = {
  purchases: Purchase[];
  onEdit?: (purchase: Purchase) => void;
  onDeleteInvoice?: (purchase: Purchase) => void;
  onDeleteBoleto?: (purchase: Purchase, index: number) => void;
  onReplaceInvoice?: (purchase: Purchase, file: File) => void;
};

type PurchaseSortKey = "description" | "installments" | "invoiceNumber" | "issueDate" | "store" | "supplier" | "total";

export function PurchasesTable({ onDeleteBoleto, onDeleteInvoice, onEdit, onReplaceInvoice, purchases }: Props) {
  const canManage = Boolean(onEdit);
  const [sort, setSort] = useState<{ direction: SortDirection; key: PurchaseSortKey }>({ direction: "desc", key: "issueDate" });
  const orderedPurchases = useMemo(() => purchases.toSorted((a, b) => {
    const left = sort.key === "total" ? parseBRL(a.total) : sort.key === "issueDate" ? parseDateBR(a.issueDate).getTime() : a[sort.key];
    const right = sort.key === "total" ? parseBRL(b.total) : sort.key === "issueDate" ? parseDateBR(b.issueDate).getTime() : b[sort.key];
    const comparison = typeof left === "number" && typeof right === "number" ? left - right : String(left).localeCompare(String(right), "pt-BR", { numeric: true, sensitivity: "base" });
    return sort.direction === "asc" ? comparison : -comparison;
  }), [purchases, sort]);
  const requestSort = (key: PurchaseSortKey) => setSort((current) => ({ direction: current.key === key && current.direction === "asc" ? "desc" : "asc", key }));

  return (
    <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4"><h3 className="text-base font-semibold text-slate-950">Notas lançadas</h3></div>
      <div className="space-y-3 p-3 lg:hidden">
        {orderedPurchases.length ? orderedPurchases.map((purchase) => (
          <article className="rounded-lg border border-slate-200 p-4" key={purchase.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-700">Nota {purchase.invoiceNumber}</p>
                <h4 className="mt-1 break-words font-semibold text-slate-950">{purchase.supplier}</h4>
              </div>
              <span className="shrink-0 font-semibold text-slate-950">{purchase.total}</span>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div><dt className="text-xs text-slate-500">Loja</dt><dd className="mt-1 break-words text-slate-700">{purchase.store}</dd></div>
              <div><dt className="text-xs text-slate-500">Data</dt><dd className="mt-1 text-slate-700">{purchase.issueDate}</dd></div>
              <div><dt className="text-xs text-slate-500">Parcelas</dt><dd className="mt-1 text-slate-700">{purchase.installments}</dd></div>
              <div><dt className="text-xs text-slate-500">Anexos</dt><dd className="mt-1 text-slate-700">{(purchase.invoiceAttachment ? 1 : 0) + (purchase.boletoAttachments?.length || 0)}</dd></div>
            </dl>
            <p className="mt-4 break-words border-t border-slate-100 pt-3 text-sm text-slate-600">{purchase.description || "Produto ou descrição não informado"}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {purchase.invoiceAttachment ? <span className="inline-flex"><a aria-label="Abrir nota fiscal" className="rounded-l-md border border-slate-200 p-2 text-cyan-700 hover:bg-cyan-50" href={purchase.invoiceAttachment.url} rel="noreferrer" target="_blank" title={`Abrir ${purchase.invoiceAttachment.name}`}><FileText size={16} /></a>{onDeleteInvoice ? <button aria-label="Excluir nota fiscal" className="rounded-r-md border border-l-0 border-slate-200 p-2 text-rose-700 hover:bg-rose-50" onClick={() => onDeleteInvoice(purchase)} type="button"><Trash2 size={16} /></button> : null}</span> : null}
              {purchase.boletoAttachments?.map((file, index) => <span className="inline-flex" key={`${file.url}-${index}`}><a aria-label={`Abrir boleto ${file.installment || `${index + 1}`}`} className="rounded-l-md border border-slate-200 p-2 text-slate-600 hover:bg-slate-100" href={file.url} rel="noreferrer" target="_blank" title={`Abrir boleto ${file.installment || `${index + 1}`}`}><Paperclip size={16} /></a>{onDeleteBoleto ? <button aria-label={`Excluir boleto ${file.installment || `${index + 1}`}`} className="rounded-r-md border border-l-0 border-slate-200 p-2 text-rose-700 hover:bg-slate-100" onClick={() => onDeleteBoleto(purchase, index)} type="button"><Trash2 size={16} /></button> : null}</span>)}
              {canManage ? <><button aria-label="Editar nota" className="rounded-md border border-slate-200 p-2 text-slate-700 hover:bg-amber-50 hover:text-amber-800" onClick={() => onEdit?.(purchase)} title="Editar os dados desta nota" type="button"><Pencil size={16} /></button><label aria-label={purchase.invoiceAttachment ? "Substituir nota fiscal" : "Anexar nota fiscal"} className="cursor-pointer rounded-md border border-slate-200 p-2 text-cyan-700 hover:bg-cyan-50" title={purchase.invoiceAttachment ? "Substituir nota fiscal" : "Anexar nota fiscal"}><Upload size={16} /><input accept="application/pdf,image/*" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) onReplaceInvoice?.(purchase, file); event.target.value = ""; }} type="file" /></label></> : null}
            </div>
          </article>
        )) : <p className="px-2 py-8 text-center text-sm text-slate-500">Nenhuma nota lançada ainda.</p>}
      </div>

      <div className="hidden max-h-[520px] overflow-auto lg:block">
      <table className="w-full min-w-[980px] text-left text-sm">
        <thead className="sticky top-0 z-10 bg-slate-50 text-slate-600"><tr><SortableHeader active={sort.key === "invoiceNumber"} direction={sort.direction} label="Nota" onClick={() => requestSort("invoiceNumber")} className="px-5 py-3" /><SortableHeader active={sort.key === "supplier"} direction={sort.direction} label="Fornecedor" onClick={() => requestSort("supplier")} className="px-5 py-3" /><SortableHeader active={sort.key === "description"} direction={sort.direction} label="Produtos" onClick={() => requestSort("description")} className="px-5 py-3" /><SortableHeader active={sort.key === "store"} direction={sort.direction} label="Loja" onClick={() => requestSort("store")} className="px-5 py-3" /><SortableHeader active={sort.key === "issueDate"} direction={sort.direction} label="Data" onClick={() => requestSort("issueDate")} className="px-5 py-3" /><SortableHeader active={sort.key === "total"} direction={sort.direction} label="Valor" onClick={() => requestSort("total")} className="px-5 py-3" /><SortableHeader active={sort.key === "installments"} direction={sort.direction} label="Parcelas" onClick={() => requestSort("installments")} className="px-5 py-3" /><th className="px-5 py-3 font-medium">Anexos</th>{canManage ? <th className="px-5 py-3 font-medium">Ações</th> : null}</tr></thead>
        <tbody className="divide-y divide-slate-100">
          {orderedPurchases.length ? orderedPurchases.map((purchase) => (
            <tr key={purchase.id}>
              <td className="px-5 py-4 font-medium">{purchase.invoiceNumber}</td><td className="px-5 py-4">{purchase.supplier}</td><td className="max-w-[260px] px-5 py-4 text-slate-700">{purchase.description || "Não informado"}</td><td className="px-5 py-4">{purchase.store}</td><td className="px-5 py-4">{purchase.issueDate}</td><td className="px-5 py-4 font-medium">{purchase.total}</td><td className="px-5 py-4">{purchase.installments}</td>
              <td className="px-5 py-4"><div className="flex flex-wrap gap-2">
                {purchase.invoiceAttachment ? <span className="inline-flex"><a className="rounded-l-md border border-slate-200 p-2 text-cyan-700 hover:bg-cyan-50" href={purchase.invoiceAttachment.url} rel="noreferrer" target="_blank" title={`Abrir ${purchase.invoiceAttachment.name}`}><FileText size={16} /></a>{onDeleteInvoice ? <button className="rounded-r-md border border-l-0 border-slate-200 p-2 text-rose-700 hover:bg-rose-50" onClick={() => onDeleteInvoice(purchase)} title="Excluir nota fiscal" type="button"><Trash2 size={16} /></button> : null}</span> : null}
                {purchase.boletoAttachments?.map((file, index) => <span className="inline-flex" key={`${file.url}-${index}`}><a className="rounded-l-md border border-slate-200 p-2 text-slate-600 hover:bg-slate-100" href={file.url} rel="noreferrer" target="_blank" title={`Abrir boleto ${file.installment || `${index + 1}`}`}><Paperclip size={16} /></a>{onDeleteBoleto ? <button className="rounded-r-md border border-l-0 border-slate-200 p-2 text-rose-700 hover:bg-slate-100" onClick={() => onDeleteBoleto(purchase, index)} title={`Excluir boleto ${file.installment || `${index + 1}`}`} type="button"><Trash2 size={16} /></button> : null}</span>)}
              </div></td>
              {canManage ? <td className="px-5 py-4"><div className="flex gap-2"><button className="rounded-md border border-slate-200 p-2 hover:bg-amber-50 hover:text-amber-800" onClick={() => onEdit?.(purchase)} title="Editar os dados desta nota" type="button"><Pencil size={17} /></button><label className="cursor-pointer rounded-md border border-slate-200 p-2 text-cyan-700 hover:bg-cyan-50" title={purchase.invoiceAttachment ? "Substituir nota fiscal" : "Anexar nota fiscal"}><Upload size={17} /><input accept="application/pdf,image/*" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) onReplaceInvoice?.(purchase, file); event.target.value = ""; }} type="file" /></label></div></td> : null}
            </tr>
          )) : <tr><td className="px-5 py-8 text-center text-slate-500" colSpan={canManage ? 9 : 8}>Nenhuma nota lançada ainda.</td></tr>}
        </tbody>
      </table>
      </div>
    </div>
  );
}
