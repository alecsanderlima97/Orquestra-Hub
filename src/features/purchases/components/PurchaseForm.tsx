import { TextField } from "@/components/ui/TextField";

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
  form,
  onChange,
  onSubmit,
}: {
  form: PurchaseFormState;
  onChange: (form: PurchaseFormState) => void;
  onSubmit: () => void;
}) {
  return (
    <form className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <TextField label="Fornecedor" onChange={(event) => onChange({ ...form, supplier: event.target.value })} placeholder="Nome Do Fornecedor" value={form.supplier} />
        <TextField label="Loja" onChange={(event) => onChange({ ...form, store: event.target.value })} placeholder="Loja De Baixo" value={form.store} />
        <TextField label="Numero da nota" onChange={(event) => onChange({ ...form, invoiceNumber: event.target.value })} placeholder="NF 0000" value={form.invoiceNumber} />
        <TextField label="Valor total" onChange={(event) => onChange({ ...form, total: event.target.value })} placeholder="R$ 0,00" value={form.total} />
        <TextField label="Data da compra" onChange={(event) => onChange({ ...form, issueDate: event.target.value })} placeholder="dd/mm/aaaa" type="date" value={form.issueDate} />
        <TextField label="Parcelas" onChange={(event) => onChange({ ...form, installments: event.target.value })} placeholder="3" type="number" value={form.installments} />
        <TextField label="Primeiro vencimento" onChange={(event) => onChange({ ...form, dueDate: event.target.value })} placeholder="dd/mm/aaaa" type="date" value={form.dueDate} />
        <button
          className="mt-7 h-11 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800"
          onClick={onSubmit}
          type="button"
        >
          Gerar parcelas
        </button>
      </div>
    </form>
  );
}
