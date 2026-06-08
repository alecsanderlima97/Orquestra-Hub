import { FormAlert } from "@/components/ui/FormAlert";
import { SelectField } from "@/components/ui/SelectField";
import { TextField } from "@/components/ui/TextField";
import { formatBRL } from "@/lib/formatters/br";

export type PurchaseFormState = {
  dueDate: string;
  installments: string;
  invoiceNumber: string;
  issueDate: string;
  store: string;
  supplier: string;
  total: string;
};

export function PurchaseForm({
  error,
  form,
  onChange,
  onSubmit,
  storeOptions,
  supplierOptions,
}: {
  error?: string;
  form: PurchaseFormState;
  onChange: (form: PurchaseFormState) => void;
  onSubmit: () => void;
  storeOptions: string[];
  supplierOptions: string[];
}) {
  return (
    <form className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SelectField label="Fornecedor" onChange={(supplier) => onChange({ ...form, supplier })} options={supplierOptions} value={form.supplier} />
        <SelectField label="Loja" onChange={(store) => onChange({ ...form, store })} options={storeOptions} value={form.store} />
        <TextField label="Número da nota" onChange={(event) => onChange({ ...form, invoiceNumber: event.target.value.toLocaleUpperCase("pt-BR") })} placeholder="NF 0000" value={form.invoiceNumber} />
        <TextField label="Valor total" onBlur={() => onChange({ ...form, total: formatBRL(form.total) })} onChange={(event) => onChange({ ...form, total: formatBRL(event.target.value) })} placeholder="R$ 0,00" value={form.total} />
        <TextField label="Data da compra" onChange={(event) => onChange({ ...form, issueDate: event.target.value })} placeholder="dd/mm/aaaa" type="date" value={form.issueDate} />
        <TextField label="Parcelas" onChange={(event) => onChange({ ...form, installments: event.target.value })} placeholder="3" type="number" value={form.installments} />
        <TextField label="Primeiro vencimento" onChange={(event) => onChange({ ...form, dueDate: event.target.value })} placeholder="dd/mm/aaaa" type="date" value={form.dueDate} />
        <button
          className="mt-7 h-11 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800"
          onClick={onSubmit}
          title="Lançar a nota e criar automaticamente as parcelas em contas a pagar."
          type="button"
        >
          Gerar parcelas
        </button>
      </div>
      <div className="mt-4">
        <FormAlert message={error} />
      </div>
    </form>
  );
}
