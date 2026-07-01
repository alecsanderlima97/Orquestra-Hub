import { Bell, CalendarClock, Pencil, Trash2 } from "lucide-react";
import { SelectField } from "@/components/ui/SelectField";
import { TextField } from "@/components/ui/TextField";
import { formatBRL, parseBRL, todaySaoPaulo, toTitleCaseBR } from "@/lib/formatters/br";
import type { FixedExpense } from "../types/fixedExpenseTypes";

const money = new Intl.NumberFormat("pt-BR", { currency: "BRL", style: "currency" });

export type FixedExpenseForm = {
  alertDays: string;
  amount: string;
  category: string;
  dueDay: string;
  name: string;
  payee: string;
  store: string;
};

export function FixedExpensesPanel({
  canWrite = true,
  error = "",
  expenses,
  form,
  onChange,
  onDelete,
  onEdit,
  onSubmit,
  storeOptions,
}: {
  canWrite?: boolean;
  error?: string;
  expenses: FixedExpense[];
  form: FixedExpenseForm;
  onChange: (form: FixedExpenseForm) => void;
  onDelete?: (expense: FixedExpense) => void;
  onEdit?: (expense: FixedExpense) => void;
  onSubmit: () => void;
  storeOptions: string[];
}) {
  const activeExpenses = expenses.filter((expense) => expense.active !== false);
  const totalMonthly = activeExpenses.reduce((total, expense) => total + parseBRL(expense.amount), 0);
  const nextExpense = activeExpenses
    .toSorted((a, b) => {
      const today = todaySaoPaulo();
      const day = today.getDate();
      const nextA = a.dueDay >= day ? a.dueDay : a.dueDay + 31;
      const nextB = b.dueDay >= day ? b.dueDay : b.dueDay + 31;
      return nextA - nextB;
    })[0];
  const largestExpense = activeExpenses.toSorted((a, b) => parseBRL(b.amount) - parseBRL(a.amount))[0];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-lg border border-cyan-100 bg-cyan-50/70 p-4">
          <p className="text-xs font-semibold uppercase text-cyan-800">Total mensal ativo</p>
          <strong className="mt-2 block text-2xl text-slate-950">{money.format(totalMonthly)}</strong>
        </article>
        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase text-slate-500">Recorrências ativas</p>
          <strong className="mt-2 block text-2xl text-slate-950">{activeExpenses.length}</strong>
        </article>
        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase text-slate-500">Próximo vencimento</p>
          <strong className="mt-2 block text-base text-slate-950">{nextExpense ? `${nextExpense.name} - dia ${nextExpense.dueDay}` : "Nenhum"}</strong>
        </article>
        <article className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold uppercase text-slate-500">Maior despesa</p>
          <strong className="mt-2 block text-base text-slate-950">{largestExpense ? `${largestExpense.name} - ${largestExpense.amount}` : "Nenhuma"}</strong>
        </article>
      </div>
      {canWrite ? (
        <div className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2 xl:grid-cols-4">
          <TextField label="Despesa" onBlur={() => onChange({ ...form, name: toTitleCaseBR(form.name) })} onChange={(event) => onChange({ ...form, name: event.target.value })} placeholder="Ex.: Aluguel" value={form.name} />
          <TextField label="Categoria" onBlur={() => onChange({ ...form, category: toTitleCaseBR(form.category) })} onChange={(event) => onChange({ ...form, category: event.target.value })} placeholder="Ex.: Estrutura" value={form.category} />
          <TextField label="Favorecido" onBlur={() => onChange({ ...form, payee: toTitleCaseBR(form.payee) })} onChange={(event) => onChange({ ...form, payee: event.target.value })} placeholder="Nome ou empresa" value={form.payee} />
          <SelectField label="Loja" onChange={(store) => onChange({ ...form, store })} options={storeOptions} value={form.store} />
          <TextField label="Valor mensal" onChange={(event) => onChange({ ...form, amount: formatBRL(event.target.value) })} placeholder="R$ 0,00" value={form.amount} />
          <TextField label="Dia do vencimento" onChange={(event) => onChange({ ...form, dueDay: event.target.value })} placeholder="10" type="number" value={form.dueDay} />
          <TextField label="Alertar com antecedencia" onChange={(event) => onChange({ ...form, alertDays: event.target.value })} placeholder="5" type="number" value={form.alertDays} />
          <button className="mt-7 h-11 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white" onClick={onSubmit} type="button">Cadastrar recorrencia</button>
          {error ? <p className="rounded-md bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 md:col-span-2 xl:col-span-4">{error}</p> : null}
        </div>
      ) : null}
      <div className="max-h-[560px] overflow-y-auto pr-1">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {expenses.map((item) => (
            <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" key={item.id}>
            <div className="flex justify-between gap-3">
              <div>
                <span className="text-xs font-semibold uppercase text-cyan-700">{item.category}</span>
                <h3 className="mt-1 font-semibold">{item.name}</h3>
                <p className="text-sm text-slate-500">{item.payee} - {item.store}</p>
              </div>
              <div className="flex items-start gap-2">
                <CalendarClock className="text-slate-400" size={20} />
                {canWrite ? (
                  <div className="flex gap-1">
                    <button aria-label="Editar despesa fixa" className="rounded-md border border-slate-200 p-2 text-slate-600 hover:bg-amber-50 hover:text-amber-800" onClick={() => onEdit?.(item)} title="Editar esta despesa fixa" type="button"><Pencil size={16} /></button>
                    <button aria-label="Excluir recorrência" className="rounded-md border border-slate-200 p-2 text-rose-600 hover:bg-rose-50" onClick={() => onDelete?.(item)} title="Excluir esta recorrência sem apagar lançamentos antigos" type="button"><Trash2 size={16} /></button>
                  </div>
                ) : null}
              </div>
            </div>
            <strong className="mt-4 block text-lg">{item.amount}</strong>
            <div className="mt-3 flex items-center gap-2 text-xs text-amber-800"><Bell size={14} />Vence todo dia {item.dueDay}; alerta {item.alertDays} dia(s) antes</div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
