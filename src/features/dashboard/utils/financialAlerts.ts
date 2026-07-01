import type { AccountPayable } from "../../accounts-payable/types/accountPayableTypes";
import type { FixedExpense } from "../../fixed-expenses/types/fixedExpenseTypes";
import { parseDateBR, todaySaoPaulo } from "../../../lib/formatters/br";

const dayMs = 86_400_000;
export type FinancialAlert = { id: string; sourceId?: string; kind: "Atrasada" | "Hoje" | "Próxima" | "Recorrente"; title: string; detail: string; days: number };
export function daysUntil(date: Date, today = todaySaoPaulo()) { return Math.round((date.getTime() - today.getTime()) / dayMs); }
function referenceMonth(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`; }
export function buildFinancialAlerts(accounts: AccountPayable[], expenses: FixedExpense[], defaultAlertDays = 5, today = todaySaoPaulo()) {
  const accountAlerts: FinancialAlert[] = accounts.filter((item) => item.status !== "Pago").map((account) => ({ account, days: daysUntil(parseDateBR(account.dueDate), today) })).filter(({ days }) => days <= defaultAlertDays).map(({ account, days }) => ({ days, detail: `${account.amount} · ${account.store} · vencimento ${account.dueDate}`, id: `account-${account.id}`, sourceId: account.id, kind: days < 0 ? "Atrasada" : days === 0 ? "Hoje" : "Próxima", title: account.supplier }));
  const expenseAlerts: FinancialAlert[] = expenses.filter((item) => item.active).map((expense) => { const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate(); let dueDate = new Date(today.getFullYear(), today.getMonth(), Math.min(expense.dueDay, lastDay)); if (dueDate < today) { const nextLastDay = new Date(today.getFullYear(), today.getMonth() + 2, 0).getDate(); dueDate = new Date(today.getFullYear(), today.getMonth() + 1, Math.min(expense.dueDay, nextLastDay)); } return { days: daysUntil(dueDate, today), expense, reference: referenceMonth(dueDate) }; }).filter(({ expense, reference }) => !accounts.some((account) => account.fixedExpenseId === expense.id && account.referenceMonth === reference)).filter(({ days, expense }) => days <= expense.alertDays).map(({ days, expense }) => ({ days, detail: `${expense.amount} · ${expense.store} · vence todo dia ${expense.dueDay}`, id: `expense-${expense.id}`, kind: "Recorrente", title: expense.name }));
  return [...accountAlerts, ...expenseAlerts].sort((a, b) => a.days - b.days);
}
