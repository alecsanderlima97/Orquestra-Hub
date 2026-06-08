import { TextField } from "@/components/ui/TextField";
import { formatBRL, toTitleCaseBR } from "@/lib/formatters/br";

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
      <TextField label="Nome da loja" onBlur={() => onChange({ ...form, name: toTitleCaseBR(form.name) })} onChange={(event) => onChange({ ...form, name: event.target.value })} placeholder="Loja de Baixo" value={form.name} />
      <TextField label="Responsável" onBlur={() => onChange({ ...form, manager: toTitleCaseBR(form.manager) })} onChange={(event) => onChange({ ...form, manager: event.target.value })} placeholder="Equipe Principal" value={form.manager} />
      <TextField label="Meta mensal" onBlur={() => onChange({ ...form, monthlyGoal: formatBRL(form.monthlyGoal) })} onChange={(event) => onChange({ ...form, monthlyGoal: formatBRL(event.target.value) })} placeholder="R$ 0,00" value={form.monthlyGoal} />
      <TextField label="Saldo atual" onBlur={() => onChange({ ...form, balance: formatBRL(form.balance) })} onChange={(event) => onChange({ ...form, balance: formatBRL(event.target.value) })} placeholder="R$ 0,00" value={form.balance} />
      <button className="mt-7 h-11 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800" onClick={onSubmit} type="button">
        Salvar loja
      </button>
    </form>
  );
}
