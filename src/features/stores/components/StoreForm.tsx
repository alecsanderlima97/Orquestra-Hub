import { TextField } from "@/components/ui/TextField";

export type StoreFormState = {
  balance: string;
  manager: string;
  monthlyGoal: string;
  name: string;
};

export function StoreForm({
  form,
  onChange,
  onSubmit,
}: {
  form: StoreFormState;
  onChange: (form: StoreFormState) => void;
  onSubmit: () => void;
}) {
  return (
    <form className="mb-4 grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-5">
      <TextField label="Nome da loja" onChange={(event) => onChange({ ...form, name: event.target.value })} placeholder="Loja De Baixo" value={form.name} />
      <TextField label="Responsavel" onChange={(event) => onChange({ ...form, manager: event.target.value })} placeholder="Equipe principal" value={form.manager} />
      <TextField label="Meta mensal" onChange={(event) => onChange({ ...form, monthlyGoal: event.target.value })} placeholder="R$ 0,00" value={form.monthlyGoal} />
      <TextField label="Saldo atual" onChange={(event) => onChange({ ...form, balance: event.target.value })} placeholder="R$ 0,00" value={form.balance} />
      <button className="mt-7 h-11 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800" onClick={onSubmit} type="button">
        Salvar loja
      </button>
    </form>
  );
}
