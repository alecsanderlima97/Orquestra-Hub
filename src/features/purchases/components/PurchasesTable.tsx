import { FileText, Paperclip, Pencil, Trash2, Upload } from "lucide-react";
import type { Purchase } from "../types/purchaseTypes";

type Props = {
  purchases: Purchase[];
  onEdit?: (purchase: Purchase) => void;
  onDeleteInvoice?: (purchase: Purchase) => void;
  onDeleteBoleto?: (purchase: Purchase, index: number) => void;
  onReplaceInvoice?: (purchase: Purchase, file: File) => void;
};

export function PurchasesTable({ onDeleteBoleto, onDeleteInvoice, onEdit, onReplaceInvoice, purchases }: Props) {
  const canManage = Boolean(onEdit);
  return (
    <div className="mt-4 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4"><h3 className="text-base font-semibold text-slate-950">Notas lançadas</h3></div>
      <table className="w-full min-w-[980px] text-left text-sm">
        <thead className="bg-slate-50 text-slate-600"><tr><th className="px-5 py-3">Nota</th><th className="px-5 py-3">Fornecedor</th><th className="px-5 py-3">Produtos</th><th className="px-5 py-3">Loja</th><th className="px-5 py-3">Data</th><th className="px-5 py-3">Valor</th><th className="px-5 py-3">Parcelas</th><th className="px-5 py-3">Anexos</th>{canManage ? <th className="px-5 py-3">Ações</th> : null}</tr></thead>
        <tbody className="divide-y divide-slate-100">
          {purchases.length ? purchases.map((purchase) => (
            <tr key={purchase.id}>
              <td className="px-5 py-4 font-medium">{purchase.invoiceNumber}</td><td className="px-5 py-4">{purchase.supplier}</td><td className="max-w-[260px] px-5 py-4 text-slate-700">{purchase.description || "Não informado"}</td><td className="px-5 py-4">{purchase.store}</td><td className="px-5 py-4">{purchase.issueDate}</td><td className="px-5 py-4 font-medium">{purchase.total}</td><td className="px-5 py-4">{purchase.installments}</td>
              <td className="px-5 py-4"><div className="flex flex-wrap gap-2">
                {purchase.invoiceAttachment ? <span className="inline-flex"><a className="rounded-l-md border border-slate-200 p-2 text-cyan-700 hover:bg-cyan-50" href={purchase.invoiceAttachment.url} rel="noreferrer" target="_blank" title={`Abrir ${purchase.invoiceAttachment.name}`}><FileText size={16} /></a>{onDeleteInvoice ? <button className="rounded-r-md border border-l-0 border-slate-200 p-2 text-rose-700 hover:bg-rose-50" onClick={() => onDeleteInvoice(purchase)} title="Excluir nota fiscal" type="button"><Trash2 size={16} /></button> : null}</span> : null}
                {purchase.boletoAttachments?.map((file, index) => <span className="inline-flex" key={`${file.url}-${index}`}><a className="rounded-l-md border border-slate-200 p-2 text-slate-600 hover:bg-slate-100" href={file.url} rel="noreferrer" target="_blank" title={`Abrir ${file.name}`}><Paperclip size={16} /></a>{onDeleteBoleto ? <button className="rounded-r-md border border-l-0 border-slate-200 p-2 text-rose-700 hover:bg-rose-50" onClick={() => onDeleteBoleto(purchase, index)} title={`Excluir boleto ${index + 1}`} type="button"><Trash2 size={16} /></button> : null}</span>)}
              </div></td>
              {canManage ? <td className="px-5 py-4"><div className="flex gap-2"><button className="rounded-md border border-slate-200 p-2 hover:bg-amber-50 hover:text-amber-800" onClick={() => onEdit?.(purchase)} title="Editar os dados desta nota" type="button"><Pencil size={17} /></button><label className="cursor-pointer rounded-md border border-slate-200 p-2 text-cyan-700 hover:bg-cyan-50" title={purchase.invoiceAttachment ? "Substituir nota fiscal" : "Anexar nota fiscal"}><Upload size={17} /><input accept="application/pdf,image/*" className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) onReplaceInvoice?.(purchase, file); event.target.value = ""; }} type="file" /></label></div></td> : null}
            </tr>
          )) : <tr><td className="px-5 py-8 text-center text-slate-500" colSpan={canManage ? 9 : 8}>Nenhuma nota lançada ainda.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
