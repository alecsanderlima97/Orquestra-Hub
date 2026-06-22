import { FileText, Paperclip } from "lucide-react";
import { FormAlert } from "@/components/ui/FormAlert";
import { SelectField } from "@/components/ui/SelectField";
import { TextField } from "@/components/ui/TextField";
import { formatBRL, toTitleCaseBR } from "@/lib/formatters/br";

export type PurchaseFormState = { categoryId: string; dailyInterestAmount: string; dailyInterestPercent: string; description: string; dueDate: string; installments: string; invoiceNumber: string; issueDate: string; lateFeeAmount: string; lateFeePercent: string; protestAfterDays: string; store: string; supplier: string; total: string };
const accept = "application/pdf,image/jpeg,image/png,image/webp";

export function PurchaseForm({ boletoFiles, categoryError, categoryOptions, error, form, invoiceFile, newCategoryName, onBoletoFilesChange, onCategoryCreate, onChange, onInvoiceFileChange, onNewCategoryNameChange, onSubmit, storeOptions, supplierOptions }: { boletoFiles: File[]; categoryError?: string; categoryOptions: { id: string; name: string }[]; error?: string; form: PurchaseFormState; invoiceFile: File | null; newCategoryName: string; onBoletoFilesChange: (files: File[]) => void; onCategoryCreate: () => void; onChange: (form: PurchaseFormState) => void; onInvoiceFileChange: (file: File | null) => void; onNewCategoryNameChange: (value: string) => void; onSubmit: () => void; storeOptions: string[]; supplierOptions: string[] }) {
  return <form className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <SelectField label="Fornecedor" onChange={(supplier) => onChange({ ...form, supplier })} options={supplierOptions} value={form.supplier} />
      <SelectField label="Loja" onChange={(store) => onChange({ ...form, store })} options={storeOptions} value={form.store} />
      <label className="block">
        <span className="text-sm font-medium text-slate-700">Categoria</span>
        <select className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200" onChange={(event) => onChange({ ...form, categoryId: event.target.value })} value={form.categoryId}>
          <option value="">Sem categoria</option>
          {categoryOptions.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
      </label>
      <div className="flex gap-2">
        <div className="min-w-0 flex-1">
          <TextField label="Nova categoria" onBlur={() => onNewCategoryNameChange(toTitleCaseBR(newCategoryName))} onChange={(event) => onNewCategoryNameChange(event.target.value)} placeholder="Ex.: Impostos" value={newCategoryName} />
          {categoryError ? <p className="mt-1 text-xs text-rose-600">{categoryError}</p> : null}
        </div>
        <button className="mt-7 h-11 shrink-0 rounded-md border border-slate-300 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50" onClick={onCategoryCreate} type="button">Criar</button>
      </div>
      <TextField label="Número da nota" onChange={(event) => onChange({ ...form, invoiceNumber: event.target.value.toLocaleUpperCase("pt-BR") })} placeholder="NF 0000" value={form.invoiceNumber} />
      <TextField label="Descrição dos produtos" onChange={(event) => onChange({ ...form, description: event.target.value })} placeholder="Ex.: Vestidos, calças e acessórios" value={form.description} />
      <TextField label="Valor total" onBlur={() => onChange({ ...form, total: formatBRL(form.total) })} onChange={(event) => onChange({ ...form, total: formatBRL(event.target.value) })} placeholder="R$ 0,00" value={form.total} />
      <TextField label="Data da compra" onChange={(event) => onChange({ ...form, issueDate: event.target.value })} placeholder="dd/mm/aaaa" type="date" value={form.issueDate} />
      <TextField label="Parcelas" onChange={(event) => onChange({ ...form, installments: event.target.value })} placeholder="1" type="number" value={form.installments} />
      <TextField label="Primeiro vencimento" onChange={(event) => onChange({ ...form, dueDate: event.target.value })} placeholder="dd/mm/aaaa" type="date" value={form.dueDate} />
    </div>
    <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4">
      <h3 className="text-sm font-semibold text-slate-950">Regras do boleto em atraso</h3>
      <p className="mt-1 text-xs text-slate-500">Preencha conforme o texto do boleto. Pode usar valor em reais, porcentagem ou ambos.</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <TextField label="Mora diaria (R$)" onBlur={() => onChange({ ...form, dailyInterestAmount: formatBRL(form.dailyInterestAmount) })} onChange={(event) => onChange({ ...form, dailyInterestAmount: formatBRL(event.target.value) })} placeholder="R$ 0,00" value={form.dailyInterestAmount} />
        <TextField label="Mora diaria (%)" onChange={(event) => onChange({ ...form, dailyInterestPercent: event.target.value.replace(/[^0-9,.]/g, "") })} placeholder="0,33" value={form.dailyInterestPercent} />
        <TextField label="Multa (R$)" onBlur={() => onChange({ ...form, lateFeeAmount: formatBRL(form.lateFeeAmount) })} onChange={(event) => onChange({ ...form, lateFeeAmount: formatBRL(event.target.value) })} placeholder="R$ 0,00" value={form.lateFeeAmount} />
        <TextField label="Multa (%)" onChange={(event) => onChange({ ...form, lateFeePercent: event.target.value.replace(/[^0-9,.]/g, "") })} placeholder="2,00" value={form.lateFeePercent} />
        <TextField label="Protesto apos dias" onChange={(event) => onChange({ ...form, protestAfterDays: event.target.value.replace(/\D/g, "") })} placeholder="Ex.: 5" type="number" value={form.protestAfterDays} />
      </div>
    </div>
    <div className="mt-5 grid gap-4 md:grid-cols-2">
      <label className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-700"><span className="flex items-center gap-2 font-semibold"><FileText size={18} />Nota fiscal</span><span className="mt-1 block text-xs text-slate-500">PDF ou imagem, até 10 MB.</span><input accept={accept} className="mt-3 block w-full text-xs" onChange={(event) => onInvoiceFileChange(event.target.files?.[0] || null)} type="file" />{invoiceFile ? <strong className="mt-2 block text-xs text-cyan-700">{invoiceFile.name}</strong> : null}</label>
      <label className="rounded-md border border-dashed border-slate-300 p-4 text-sm text-slate-700"><span className="flex items-center gap-2 font-semibold"><Paperclip size={18} />Boletos</span><span className="mt-1 block text-xs text-slate-500">Selecione um ou vários PDFs/imagens.</span><input accept={accept} className="mt-3 block w-full text-xs" multiple onChange={(event) => onBoletoFilesChange(Array.from(event.target.files || []))} type="file" />{boletoFiles.length ? <strong className="mt-2 block text-xs text-cyan-700">{boletoFiles.length} arquivo(s) selecionado(s)</strong> : null}</label>
    </div>
    <div className="mt-5 flex items-center justify-between gap-4"><FormAlert message={error} /><button className="h-11 rounded-md bg-slate-950 px-5 text-sm font-semibold text-white hover:bg-slate-800" onClick={onSubmit} title="Lançar a nota, anexos e criar automaticamente as parcelas." type="button">Gerar parcelas</button></div>
  </form>;
}
