"use client";

import { useMemo, useState } from "react";
import { Printer, RotateCcw } from "lucide-react";
import type { AccountPayable } from "@/features/accounts-payable/types/accountPayableTypes";
import type { Purchase } from "@/features/purchases/types/purchaseTypes";
import { compareDateBR, parseBRL, parseDateBR } from "@/lib/formatters/br";

const money = new Intl.NumberFormat("pt-BR", { currency: "BRL", style: "currency" });
const all = "Todos";
const fieldClass = "mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100";

function total(items: AccountPayable[]) {
  return items.reduce((sum, item) => sum + parseBRL(item.amount), 0);
}

function options(values: string[]) {
  return [all, ...new Set(values.filter(Boolean))].toSorted((a, b) => a.localeCompare(b, "pt-BR"));
}

function inPeriod(value: string, start: string, end: string) {
  const time = parseDateBR(value).getTime();
  return (!start || time >= new Date(`${start}T00:00:00`).getTime()) && (!end || time <= new Date(`${end}T23:59:59`).getTime());
}

function group(accounts: AccountPayable[], key: "store" | "supplier" | "categoryName") {
  const data = accounts.reduce<Record<string, { open: number; overdue: number; paid: number; count: number }>>((result, account) => {
    const name = account[key] || "Sem categoria";
    const item = result[name] || { open: 0, overdue: 0, paid: 0, count: 0 };
    const amount = parseBRL(account.amount);
    item.count += 1;
    if (account.status === "Pago") item.paid += amount;
    else item.open += amount;
    if (account.status === "Atrasado") item.overdue += amount;
    result[name] = item;
    return result;
  }, {});
  return Object.entries(data).map(([name, values]) => ({ name, ...values })).toSorted((a, b) => b.open - a.open);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;" })[char] || char);
}

export function FinancialReports({ accounts, purchases }: { accounts: AccountPayable[]; purchases: Purchase[] }) {
  const [filters, setFilters] = useState({ category: all, end: "", start: "", status: all, store: all, supplier: all });
  const stores = options([...accounts.map((item) => item.store), ...purchases.map((item) => item.store)]);
  const suppliers = options([...accounts.map((item) => item.supplier), ...purchases.map((item) => item.supplier)]);
  const categories = options(accounts.map((item) => item.categoryName || "Sem categoria"));
  const filteredAccounts = useMemo(
    () => accounts.filter((item) =>
      (filters.store === all || item.store === filters.store)
      && (filters.supplier === all || item.supplier === filters.supplier)
      && (filters.category === all || (item.categoryName || "Sem categoria") === filters.category)
      && (filters.status === all || item.status === filters.status)
      && inPeriod(item.dueDate, filters.start, filters.end),
    ),
    [accounts, filters],
  );
  const filteredPurchases = useMemo(
    () => purchases.filter((item) =>
      (filters.store === all || item.store === filters.store)
      && (filters.supplier === all || item.supplier === filters.supplier)
      && inPeriod(item.issueDate, filters.start, filters.end),
    ),
    [purchases, filters],
  );
  const paid = filteredAccounts.filter((item) => item.status === "Pago");
  const open = filteredAccounts.filter((item) => item.status !== "Pago");
  const overdue = filteredAccounts.filter((item) => item.status === "Atrasado");
  const byCategory = group(filteredAccounts, "categoryName");
  const byStore = group(filteredAccounts, "store");
  const bySupplier = group(filteredAccounts, "supplier");
  const orderedAccounts = filteredAccounts.toSorted((a, b) => compareDateBR(a.dueDate, b.dueDate));
  const clear = () => setFilters({ category: all, end: "", start: "", status: all, store: all, supplier: all });
  const printReport = () => {
    const reportWindow = window.open("", "_blank", "width=1100,height=800");
    if (!reportWindow) return;
    const filterLine = `Período: ${filters.start || "Início"} até ${filters.end || "Atual"} · Loja: ${filters.store} · Fornecedor: ${filters.supplier} · Categoria: ${filters.category} · Status: ${filters.status}`;
    const accountRows = orderedAccounts.length ? orderedAccounts.map((item) => `<tr><td>${escapeHtml(item.supplier)}</td><td>${escapeHtml(item.categoryName || "Sem categoria")}</td><td>${escapeHtml(item.store)}</td><td>${escapeHtml(item.installment)}</td><td>${escapeHtml(item.dueDate)}</td><td>${escapeHtml(item.amount)}</td><td>${escapeHtml(item.status)}</td></tr>`).join("") : `<tr><td colspan="7" class="empty">Nenhuma conta encontrada.</td></tr>`;
    const purchaseRows = filteredPurchases.length ? filteredPurchases.map((item) => `<tr><td>${escapeHtml(item.invoiceNumber)}</td><td>${escapeHtml(item.issueDate)}</td><td>${escapeHtml(item.supplier)}</td><td>${escapeHtml(item.store)}</td><td>${escapeHtml(item.description || "Não informado")}</td><td>${escapeHtml(item.total)}</td></tr>`).join("") : `<tr><td colspan="6" class="empty">Nenhuma compra encontrada.</td></tr>`;
    const breakdownRows = (items: typeof byCategory) => items.length ? items.map((item) => `<tr><td>${escapeHtml(item.name)}</td><td>${item.count}</td><td>${money.format(item.open)}</td><td>${money.format(item.paid)}</td><td>${money.format(item.overdue)}</td></tr>`).join("") : `<tr><td colspan="5" class="empty">Nenhum dado no período.</td></tr>`;
    reportWindow.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8" /><title>Relatório financeiro</title><style>
      * { box-sizing: border-box; } body { margin: 0; padding: 28px; color: #0f172a; font-family: Arial, sans-serif; background: #fff; }
      header { border-bottom: 2px solid #0f172a; margin-bottom: 20px; padding-bottom: 14px; } h1 { margin: 0; font-size: 24px; } h2 { margin: 22px 0 10px; font-size: 16px; }
      .meta { margin-top: 8px; color: #475569; font-size: 12px; line-height: 1.5; } .cards { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 18px; }
      .card { border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; } .card small { display: block; color: #64748b; } .card strong { display: block; margin-top: 6px; font-size: 16px; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 18px; font-size: 11px; } th, td { border: 1px solid #cbd5e1; padding: 7px; text-align: left; vertical-align: top; } th { background: #f1f5f9; color: #334155; }
      .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; } .empty { color: #64748b; text-align: center; } @media print { body { padding: 18px; } }
    </style></head><body>
      <header><h1>Orquestra Hub - Relatório financeiro</h1><p class="meta">${escapeHtml(filterLine)}<br />Gerado em ${escapeHtml(new Date().toLocaleString("pt-BR"))}</p></header>
      <section class="cards"><div class="card"><small>Compras lançadas</small><strong>${filteredPurchases.length}</strong><small>${money.format(filteredPurchases.reduce((sum, item) => sum + parseBRL(item.total), 0))}</small></div><div class="card"><small>Total em aberto</small><strong>${money.format(total(open))}</strong><small>${open.length} conta(s)</small></div><div class="card"><small>Total pago</small><strong>${money.format(total(paid))}</strong><small>${paid.length} baixa(s)</small></div><div class="card"><small>Total atrasado</small><strong>${money.format(total(overdue))}</strong><small>${overdue.length} vencida(s)</small></div><div class="card"><small>Com comprovante</small><strong>${filteredAccounts.filter((item) => item.receiptName).length}</strong><small>Pagamentos documentados</small></div></section>
      <section class="grid"><div><h2>Por categoria</h2><table><thead><tr><th>Categoria</th><th>Qtd.</th><th>Aberto</th><th>Pago</th><th>Atrasado</th></tr></thead><tbody>${breakdownRows(byCategory)}</tbody></table></div><div><h2>Por loja</h2><table><thead><tr><th>Loja</th><th>Qtd.</th><th>Aberto</th><th>Pago</th><th>Atrasado</th></tr></thead><tbody>${breakdownRows(byStore)}</tbody></table></div><div><h2>Por fornecedor</h2><table><thead><tr><th>Fornecedor</th><th>Qtd.</th><th>Aberto</th><th>Pago</th><th>Atrasado</th></tr></thead><tbody>${breakdownRows(bySupplier)}</tbody></table></div></section>
      <h2>Contas do período</h2><table><thead><tr><th>Fornecedor</th><th>Categoria</th><th>Loja</th><th>Parcela</th><th>Vencimento</th><th>Valor</th><th>Status</th></tr></thead><tbody>${accountRows}</tbody></table>
      <h2>Compras e notas do período</h2><table><thead><tr><th>Nota</th><th>Data</th><th>Fornecedor</th><th>Loja</th><th>Descrição</th><th>Total</th></tr></thead><tbody>${purchaseRows}</tbody></table>
    </body></html>`);
    reportWindow.document.close();
    reportWindow.focus();
    window.setTimeout(() => reportWindow.print(), 300);
  };

  return (
    <div className="printable-reports space-y-5" id="printable-reports">
      <div className="no-print grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-2 xl:grid-cols-6">
        <Filter label="Data inicial"><input className={fieldClass} onChange={(event) => setFilters({ ...filters, start: event.target.value })} type="date" value={filters.start} /></Filter>
        <Filter label="Data final"><input className={fieldClass} onChange={(event) => setFilters({ ...filters, end: event.target.value })} type="date" value={filters.end} /></Filter>
        <Filter label="Loja"><select className={fieldClass} onChange={(event) => setFilters({ ...filters, store: event.target.value })} value={filters.store}>{stores.map((item) => <option key={item}>{item}</option>)}</select></Filter>
        <Filter label="Fornecedor"><select className={fieldClass} onChange={(event) => setFilters({ ...filters, supplier: event.target.value })} value={filters.supplier}>{suppliers.map((item) => <option key={item}>{item}</option>)}</select></Filter>
        <Filter label="Categoria"><select className={fieldClass} onChange={(event) => setFilters({ ...filters, category: event.target.value })} value={filters.category}>{categories.map((item) => <option key={item}>{item}</option>)}</select></Filter>
        <Filter label="Status"><select className={fieldClass} onChange={(event) => setFilters({ ...filters, status: event.target.value })} value={filters.status}><option>{all}</option><option>Aberto</option><option>Pago</option><option>Atrasado</option></select></Filter>
        <div className="flex gap-2 md:col-span-2 xl:col-span-6 xl:justify-end">
          <button className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 px-4 text-sm font-semibold hover:bg-slate-50" onClick={clear} type="button"><RotateCcw size={16} />Limpar filtros</button>
          <button className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800" onClick={printReport} title="Imprimir ou salvar somente este relatório em PDF" type="button"><Printer size={17} />Imprimir relatório</button>
        </div>
      </div>
      <div className="hidden print:block"><h2 className="text-xl font-bold">Orquestra Hub - Relatório financeiro</h2><p className="mt-1 text-sm">Período: {filters.start || "Início"} até {filters.end || "Atual"} - Loja: {filters.store} - Fornecedor: {filters.supplier} - Categoria: {filters.category} - Status: {filters.status}</p></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><ReportCard label="Compras lançadas" value={String(filteredPurchases.length)} helper={money.format(filteredPurchases.reduce((sum, item) => sum + parseBRL(item.total), 0))} /><ReportCard label="Total em aberto" value={money.format(total(open))} helper={`${open.length} conta(s)`} /><ReportCard label="Total pago" value={money.format(total(paid))} helper={`${paid.length} baixa(s)`} /><ReportCard label="Total atrasado" value={money.format(total(overdue))} helper={`${overdue.length} vencida(s)`} /><ReportCard label="Com comprovante" value={String(filteredAccounts.filter((item) => item.receiptName).length)} helper="Pagamentos documentados" /></div>
      <div className="grid gap-5 xl:grid-cols-3"><Breakdown title="Detalhamento por categoria" items={byCategory} /><Breakdown title="Detalhamento por loja" items={byStore} /><Breakdown title="Detalhamento por fornecedor" items={bySupplier} /></div>
      <ReportTable accounts={orderedAccounts} />
      <PurchasesReportTable purchases={filteredPurchases} />
    </div>
  );
}

function Filter({ children, label }: { children: React.ReactNode; label: string }) { return <label className="block"><span className="text-sm font-medium text-slate-700">{label}</span>{children}</label>; }
function ReportCard({ label, value, helper }: { label: string; value: string; helper: string }) { return <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><p className="text-sm text-slate-500">{label}</p><strong className="mt-2 block text-xl">{value}</strong><span className="mt-1 block text-xs text-slate-500">{helper}</span></article>; }
function Breakdown({ items, title }: { items: { name: string; open: number; overdue: number; paid: number; count: number }[]; title: string }) { return <div className="rounded-lg border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 px-5 py-4"><h3 className="font-semibold">{title}</h3></div><div className="divide-y divide-slate-100">{items.length ? items.map((item) => <div className="px-5 py-4" key={item.name}><div className="flex justify-between gap-4"><strong>{item.name}</strong><span className="text-sm text-slate-500">{item.count} conta(s)</span></div><div className="mt-2 grid grid-cols-3 gap-2 text-xs"><span>Aberto: <b>{money.format(item.open)}</b></span><span>Pago: <b>{money.format(item.paid)}</b></span><span>Atrasado: <b className="text-rose-700">{money.format(item.overdue)}</b></span></div></div>) : <p className="px-5 py-8 text-center text-sm text-slate-500">Nenhum dado no período.</p>}</div></div>; }
function ReportTable({ accounts }: { accounts: AccountPayable[] }) { return <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 px-5 py-4"><h3 className="font-semibold">Contas do período</h3></div><div className="max-h-[460px] overflow-auto"><table className="w-full min-w-[860px] text-left text-sm"><thead className="sticky top-0 z-10 bg-slate-50 text-slate-600"><tr><th className="px-5 py-3">Fornecedor</th><th className="px-5 py-3">Categoria</th><th className="px-5 py-3">Loja</th><th className="px-5 py-3">Parcela</th><th className="px-5 py-3">Vencimento</th><th className="px-5 py-3">Valor</th><th className="px-5 py-3">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{accounts.length ? accounts.map((item) => <tr key={item.id}><td className="px-5 py-3 font-medium">{item.supplier}</td><td className="px-5 py-3">{item.categoryName || "Sem categoria"}</td><td className="px-5 py-3">{item.store}</td><td className="px-5 py-3">{item.installment}</td><td className="px-5 py-3">{item.dueDate}</td><td className="px-5 py-3 font-medium">{item.amount}</td><td className="px-5 py-3">{item.status}</td></tr>) : <tr><td className="px-5 py-8 text-center text-slate-500" colSpan={7}>Nenhuma conta encontrada.</td></tr>}</tbody></table></div></div>; }
function PurchasesReportTable({ purchases }: { purchases: Purchase[] }) { return <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 px-5 py-4"><h3 className="font-semibold">Compras e notas do período</h3></div><div className="max-h-[460px] overflow-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="sticky top-0 z-10 bg-slate-50 text-slate-600"><tr><th className="px-5 py-3">Nota</th><th className="px-5 py-3">Data</th><th className="px-5 py-3">Fornecedor</th><th className="px-5 py-3">Loja</th><th className="px-5 py-3">Descrição</th><th className="px-5 py-3">Total</th></tr></thead><tbody className="divide-y divide-slate-100">{purchases.length ? purchases.map((item) => <tr key={item.id}><td className="px-5 py-3 font-medium">{item.invoiceNumber}</td><td className="px-5 py-3">{item.issueDate}</td><td className="px-5 py-3">{item.supplier}</td><td className="px-5 py-3">{item.store}</td><td className="px-5 py-3">{item.description || "Não informado"}</td><td className="px-5 py-3 font-medium">{item.total}</td></tr>) : <tr><td className="px-5 py-8 text-center text-slate-500" colSpan={6}>Nenhuma compra encontrada.</td></tr>}</tbody></table></div></div>; }
