import { FileText, Paperclip } from "lucide-react";
import { FormAlert } from "@/components/ui/FormAlert";
import { SelectField } from "@/components/ui/SelectField";
import { TextField } from "@/components/ui/TextField";
import { formatBRL } from "@/lib/formatters/br";

export type PurchaseFormState = { description: string; dueDate: string; installments: string; interestAmount: string; invoiceNumber: string; issueDate: string; lateFeeAmount: string; store: string; supplier: string; total: string };
const accept = "application/pdf,image/jpeg,image/png,image/webp";

export function PurchaseForm({ boletoFiles, error, form, invoiceFile, onBoletoFilesChange, onChange, onInvoiceFileChange, onSubmit, storeOptions, supplierOptions }: { boletoFiles: File[]; error?: string; form: PurchaseFormState; invoiceFile: File | null; onBoletoFilesChange: (files: File[]) => void; onChange: (form: PurchaseFormState) => void; onInvoiceFileChange: (file: File | null) => void; onSubmit: () => void; storeOptions: string[]; supplierOptions: string[] }) {
  return <form className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <SelectField label="Fornecedor" onChange={(supplier) => onChange({ ...form, supplier })} options={supplierOptions} value={form.supplier} />
      <SelectField label="Loja" onChange={(store) => onChange({ ...form, store })} options={storeOptions} value={form.store} />
      <TextField label="Número da nota" onChange={(event) => onChange({ ...form, invoiceNumber: event.target.value.toLocaleUpperCase("pt-BR") })} placeholder="NF 0000" value={form.invoiceNumber} />
      <TextField label="Descrição dos produtos" onChange={(event) => onChange({ ...form, description: event.target.value })} placeholder="Ex.: Vestidos, calças e acessórios" value={form.description} />
      <TextField label="Valor total" onBlur={() => onChange({ ...form, total: formatBRL(form.total) })} onChange={(event) => onChange({ ...form, total: formatBRL(event.target.value) })} placeholder="R$ 0,00" value={form.total} />
      <TextField label="Juros por atraso" onBlur={() => onChange({ ...form, interestAmount: formatBRL(form.interestAmount) })} onChange={(event) => onChange({ ...form, interestAmount: formatBRL(event.target.value) })} placeholder="R$ 0,00" value={form.interestAmount} />
      <TextField label="Mora por atraso" onBlur={() => onChange({ ...form, lateFeeAmount: formatBRL(form.lateFeeAmount) })} onChange={(event) => onChange({ ...form, lateFeeAmount: formatBRL(event.target.value) })} placeholder="R$ 0,00" value={form.lateFeeAmount} />
      <TextField label="Data da compra" onChange={(event) => onChange({ ...form, issueDate: event.target.value })} placeholder="dd/mm/aaaa" type="date" value={form.issueDate} />
      <TextField label="Parcelas" onChange={(event) => onChange({ ...form, installments: event.target.value })} placeholder="1" type="number" value={form.installments} />
      <TextField label="Primeiro vencimento" onChange={(event) => onChange({ ...form, dueDate: event.target.value })} placeholder="dd/mm/aaaa" type="date" value={form.dueDate} />
    </div>
    <div className="mt-5 grid gap-4 md:grid-cols-2">
      <label className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-700"><span className="flex items-center gap-2 font-semibold"><FileText size={18} />Nota fiscal</span><span className="mt-1 block text-xs text-slate-500">PDF ou imagem, até 10 MB.</span><input accept={accept} className="mt-3 block w-full text-xs" onChange={(event) => onInvoiceFileChange(event.target.files?.[0] || null)} type="file" />{invoiceFile ? <strong className="mt-2 block text-xs text-cyan-700">{invoiceFile.name}</strong> : null}</label>
      <label className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-700"><span className="flex items-center gap-2 font-semibold"><Paperclip size={18} />Boletos</span><span className="mt-1 block text-xs text-slate-500">Selecione um ou vários PDFs/imagens.</span><input accept={accept} className="mt-3 block w-full text-xs" multiple onChange={(event) => onBoletoFilesChange(Array.from(event.target.files || []))} type="file" />{boletoFiles.length ? <strong className="mt-2 block text-xs text-cyan-700">{boletoFiles.length} arquivo(s) selecionado(s)</strong> : null}</label>
    </div>
    <div className="mt-5 flex items-center justify-between gap-4"><FormAlert message={error} /><button className="h-11 rounded-md bg-slate-950 px-5 text-sm font-semibold text-white hover:bg-slate-800" onClick={onSubmit} title="Lançar a nota, anexos e criar automaticamente as parcelas." type="button">Gerar parcelas</button></div>
  </form>;
}
