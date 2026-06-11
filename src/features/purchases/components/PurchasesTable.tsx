import { FileText, Paperclip, Pencil } from "lucide-react";
import type { Purchase } from "../types/purchaseTypes";

export function PurchasesTable({ onEdit, purchases }: { onEdit?: (purchase: Purchase) => void; purchases: Purchase[] }) {
  return <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
    <div className="border-b border-slate-200 px-5 py-4"><h3 className="text-base font-semibold text-slate-950">Notas lançadas</h3></div>
    <table className="w-full min-w-[980px] text-left text-sm">
      <thead className="bg-slate-50 text-slate-600"><tr><th className="px-5 py-3">Nota</th><th className="px-5 py-3">Fornecedor</th><th className="px-5 py-3">Produtos</th><th className="px-5 py-3">Loja</th><th className="px-5 py-3">Data</th><th className="px-5 py-3">Valor</th><th className="px-5 py-3">Parcelas</th><th className="px-5 py-3">Anexos</th><th className="px-5 py-3">Ações</th></tr></thead>
      <tbody className="divide-y divide-slate-100">{purchases.length ? purchases.map((purchase) => <tr key={purchase.id}>
        <td className="px-5 py-4 font-medium">{purchase.invoiceNumber}</td><td className="px-5 py-4">{purchase.supplier}</td><td className="max-w-[260px] px-5 py-4 text-slate-700">{purchase.description || "Não informado"}</td><td className="px-5 py-4">{purchase.store}</td><td className="px-5 py-4">{purchase.issueDate}</td><td className="px-5 py-4 font-medium">{purchase.total}</td><td className="px-5 py-4">{purchase.installments}</td><td className="px-5 py-4"><div className="flex gap-2">{purchase.invoiceAttachment ? <a aria-label="Abrir nota fiscal" className="rounded-md border border-slate-200 p-2 text-cyan-700 hover:bg-cyan-50" href={purchase.invoiceAttachment.url} rel="noreferrer" target="_blank" title={purchase.invoiceAttachment.name}><FileText size={16} /></a> : null}{purchase.boletoAttachments?.map((file, index) => <a aria-label={`Abrir boleto ${index + 1}`} className="rounded-md border border-slate-200 p-2 text-slate-600 hover:bg-slate-100" href={file.url} key={`${file.url}-${index}`} rel="noreferrer" target="_blank" title={file.name}><Paperclip size={16} /></a>)}</div></td><td className="px-5 py-4"><button aria-label="Editar nota" className="rounded-md border border-slate-200 p-2 hover:bg-amber-50 hover:text-amber-800" onClick={() => onEdit?.(purchase)} title="Editar os dados desta nota" type="button"><Pencil size={17} /></button></td>
      </tr>) : <tr><td className="px-5 py-8 text-center text-slate-500" colSpan={9}>Nenhuma nota lançada ainda.</td></tr>}</tbody>
    </table>
  </div>;
}
