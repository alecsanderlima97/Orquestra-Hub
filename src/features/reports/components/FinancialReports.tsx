"use client";

import { useMemo, useState } from "react";
import { Download, Plus, Printer, RotateCcw, X } from "lucide-react";
import { CollapsiblePanel } from "@/components/ui/CollapsiblePanel";
import { SensitiveValue } from "@/components/ui/PrivacyContext";
import { SortableHeader, type SortDirection } from "@/components/ui/SortableHeader";
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

function csvCell(value: string | number) {
  return `"${String(value).replace(/"/g, "\"\"")}"`;
}

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(";")).join("\r\n")}`;
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.download = filename;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}

export function FinancialReports({ accounts, purchases }: { accounts: AccountPayable[]; purchases: Purchase[] }) {
  const [filters, setFilters] = useState({ category: all, end: "", invoice: "", start: "", status: all, store: all, supplier: all });
  const [showReportForm, setShowReportForm] = useState(false);
  const stores = options([...accounts.map((item) => item.store), ...purchases.map((item) => item.store)]);
  const suppliers = options([...accounts.map((item) => item.supplier), ...purchases.map((item) => item.supplier)]);
  const categories = options(accounts.map((item) => item.categoryName || "Sem categoria"));
  const filteredAccounts = useMemo(
    () => accounts.filter((item) =>
      (filters.store === all || item.store === filters.store)
      && (filters.supplier === all || item.supplier === filters.supplier)
      && (filters.category === all || (item.categoryName || "Sem categoria") === filters.category)
      && (filters.status === all || item.status === filters.status)
      && (!filters.invoice.trim() || (item.invoiceNumber || "").toLocaleLowerCase("pt-BR").includes(filters.invoice.trim().toLocaleLowerCase("pt-BR")))
      && inPeriod(item.dueDate, filters.start, filters.end),
    ),
    [accounts, filters],
  );
  const filteredPurchases = useMemo(
    () => purchases.filter((item) =>
      (filters.store === all || item.store === filters.store)
      && (filters.supplier === all || item.supplier === filters.supplier)
      && (!filters.invoice.trim() || item.invoiceNumber.toLocaleLowerCase("pt-BR").includes(filters.invoice.trim().toLocaleLowerCase("pt-BR")))
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
  const clear = () => setFilters({ category: all, end: "", invoice: "", start: "", status: all, store: all, supplier: all });
  const filterLine = `Período: ${filters.start || "Início"} até ${filters.end || "Atual"} · Nota: ${filters.invoice || "Todas"} · Loja: ${filters.store} · Fornecedor: ${filters.supplier} · Categoria: ${filters.category} · Status: ${filters.status}`;
  const exportExcel = () => downloadCsv(`relatorio-financeiro-${new Date().toISOString().slice(0, 10)}.csv`, [
    ["Orquestra Hub - Relatório financeiro"],
    [filterLine],
    [],
    ["Contas a pagar"],
    ["Nota", "Fornecedor", "Categoria", "Loja", "Parcela", "Vencimento", "Valor", "Status", "Pago em", "Comprovante"],
    ...orderedAccounts.map((item) => [item.invoiceNumber || "Sem nota", item.supplier, item.categoryName || "Sem categoria", item.store, item.installment, item.dueDate, item.amount, item.status, item.paidAt || "", item.receiptName || ""]),
    [],
    ["Compras e notas"],
    ["Nota", "Data", "Fornecedor", "Loja", "Descrição", "Total"],
    ...filteredPurchases.map((item) => [item.invoiceNumber, item.issueDate, item.supplier, item.store, item.description || "Não informado", item.total]),
  ]);
  const printReport = () => {
    const reportWindow = window.open("", "_blank", "width=1100,height=800");
    if (!reportWindow) return;
    const accountRows = orderedAccounts.length ? orderedAccounts.map((item) => `<tr><td>${escapeHtml(item.invoiceNumber || "Sem nota")}</td><td>${escapeHtml(item.supplier)}</td><td>${escapeHtml(item.categoryName || "Sem categoria")}</td><td>${escapeHtml(item.store)}</td><td>${escapeHtml(item.installment)}</td><td>${escapeHtml(item.dueDate)}</td><td>${escapeHtml(item.amount)}</td><td>${escapeHtml(item.status)}</td></tr>`).join("") : `<tr><td colspan="8" class="empty">Nenhuma conta encontrada.</td></tr>`;
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
      <h2>Pagamentos do período</h2><table><thead><tr><th>Nota</th><th>Fornecedor</th><th>Categoria</th><th>Loja</th><th>Parcela</th><th>Vencimento</th><th>Valor</th><th>Status</th></tr></thead><tbody>${accountRows}</tbody></table>
      <h2>Compras/notas lançadas no período</h2><table><thead><tr><th>Nota</th><th>Data</th><th>Fornecedor</th><th>Loja</th><th>Descrição</th><th>Total</th></tr></thead><tbody>${purchaseRows}</tbody></table>
    </body></html>`);
    reportWindow.document.close();
    reportWindow.focus();
    window.setTimeout(() => reportWindow.print(), 300);
  };

  return (
    <div className="printable-reports space-y-5" id="printable-reports">
      <div className="no-print flex justify-end">
        <button className="inline-flex h-11 items-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm hover:bg-slate-800" onClick={() => setShowReportForm((current) => !current)} type="button">
          {showReportForm ? <X size={18} /> : <Plus size={18} />}
          {showReportForm ? "Ocultar filtros" : "Gerar novo relatório"}
        </button>
      </div>
      {showReportForm ? <div className="no-print space-y-4 rounded-lg border border-cyan-200 bg-cyan-50/30 p-5 shadow-[0_0_18px_rgba(34,211,238,0.12)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-sm font-semibold text-slate-700">Visão do relatório</span>
            <div className="mt-2 inline-flex flex-wrap rounded-md border border-slate-300 p-1" role="group">
              {[{ label: "Geral", value: all }, { label: "A pagar", value: "Aberto" }, { label: "Pagos", value: "Pago" }, { label: "Atrasados", value: "Atrasado" }].map((mode) => (
                <button aria-pressed={filters.status === mode.value} className={`rounded px-3 py-2 text-xs font-semibold transition ${filters.status === mode.value ? "bg-slate-950 text-white" : "text-slate-600 hover:bg-slate-100"}`} key={mode.value} onClick={() => setFilters((current) => ({ ...current, status: mode.value }))} type="button">{mode.label}</button>
              ))}
            </div>
          </div>
          <p className="text-sm text-slate-500">{filteredAccounts.length} conta(s) e {filteredPurchases.length} compra(s) encontradas</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-7">
        <Filter label="Data inicial"><input className={fieldClass} onChange={(event) => setFilters({ ...filters, start: event.target.value })} type="date" value={filters.start} /></Filter>
        <Filter label="Data final"><input className={fieldClass} onChange={(event) => setFilters({ ...filters, end: event.target.value })} type="date" value={filters.end} /></Filter>
        <Filter label="Número da nota"><input className={fieldClass} onChange={(event) => setFilters({ ...filters, invoice: event.target.value })} placeholder="NF 1003" type="search" value={filters.invoice} /></Filter>
        <Filter label="Loja"><select className={fieldClass} onChange={(event) => setFilters({ ...filters, store: event.target.value })} value={filters.store}>{stores.map((item) => <option key={item}>{item}</option>)}</select></Filter>
        <Filter label="Fornecedor"><select className={fieldClass} onChange={(event) => setFilters({ ...filters, supplier: event.target.value })} value={filters.supplier}>{suppliers.map((item) => <option key={item}>{item}</option>)}</select></Filter>
        <Filter label="Categoria"><select className={fieldClass} onChange={(event) => setFilters({ ...filters, category: event.target.value })} value={filters.category}>{categories.map((item) => <option key={item}>{item}</option>)}</select></Filter>
        <Filter label="Status"><select className={fieldClass} onChange={(event) => setFilters({ ...filters, status: event.target.value })} value={filters.status}><option>{all}</option><option>Aberto</option><option>Pago</option><option>Atrasado</option></select></Filter>
        </div>
        <div className="flex gap-2 md:col-span-2 xl:col-span-6 xl:justify-end">
          <button className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 px-4 text-sm font-semibold hover:bg-slate-50" onClick={clear} type="button"><RotateCcw size={16} />Limpar filtros</button>
          <button className="inline-flex h-10 items-center gap-2 rounded-md border border-emerald-700 px-4 text-sm font-semibold text-emerald-800 hover:bg-emerald-50" onClick={exportExcel} title="Baixar os dados filtrados em CSV compatível com Excel" type="button"><Download size={17} />Exportar Excel</button>
          <button className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800" onClick={printReport} title="Imprimir ou salvar somente este relatório em PDF" type="button"><Printer size={17} />Imprimir relatório</button>
        </div>
      </div> : null}
      <div className="hidden print:block"><h2 className="text-xl font-bold">Orquestra Hub - Relatório financeiro</h2><p className="mt-1 text-sm">{filterLine}</p></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><ReportCard label="Compras lançadas" tone="neutral" value={String(filteredPurchases.length)} helper={money.format(filteredPurchases.reduce((sum, item) => sum + parseBRL(item.total), 0))} /><ReportCard label="Total em aberto" tone="warning" value={money.format(total(open))} helper={`${open.length} conta(s)`} /><ReportCard label="Total pago" tone="success" value={money.format(total(paid))} helper={`${paid.length} baixa(s)`} /><ReportCard label="Total atrasado" tone="danger" value={money.format(total(overdue))} helper={`${overdue.length} vencida(s)`} /><ReportCard label="Com comprovante" tone="neutral" value={String(filteredAccounts.filter((item) => item.receiptName).length)} helper="Pagamentos documentados" /></div>
      <div className="grid gap-5 xl:grid-cols-3"><Breakdown storageKey="reports-breakdown-category" title="Detalhamento por categoria" items={byCategory} /><Breakdown storageKey="reports-breakdown-store" title="Detalhamento por loja" items={byStore} /><Breakdown storageKey="reports-breakdown-supplier" title="Detalhamento por fornecedor" items={bySupplier} /></div>
      <ReportTable accounts={orderedAccounts} />
      <PurchasesReportTable purchases={filteredPurchases} />
    </div>
  );
}

function Filter({ children, label }: { children: React.ReactNode; label: string }) { return <label className="block"><span className="text-sm font-medium text-slate-700">{label}</span>{children}</label>; }
function ReportCard({ helper, label, tone, value }: { helper: string; label: string; tone: "danger" | "neutral" | "success" | "warning"; value: string }) {
  const toneStyles = {
    danger: "dashboard-card-danger border-rose-200 bg-rose-50 text-rose-950",
    neutral: "dashboard-card-neutral border-slate-200 bg-white text-slate-900",
    success: "dashboard-card-success border-emerald-200 bg-emerald-50 text-emerald-950",
    warning: "dashboard-card-warning border-amber-200 bg-amber-50 text-amber-950",
  };
  return <article className={`motion-card min-w-0 rounded-lg border p-5 shadow-sm ${toneStyles[tone]}`}><p className="break-words text-sm font-medium text-slate-600">{label}</p><strong className="mt-2 block text-xl"><SensitiveValue className="whitespace-nowrap" value={value} /></strong><span className="mt-1 block text-xs text-slate-600"><SensitiveValue showToggle={false} value={helper} /></span></article>;
}
function Breakdown({ items, storageKey, title }: { items: { name: string; open: number; overdue: number; paid: number; count: number }[]; storageKey: string; title: string }) {
  return <CollapsiblePanel description="Valores abertos, pagos e atrasados agrupados para conferência." eyebrow="Detalhamento" storageKey={storageKey} title={title}>
    <div className="max-h-[360px] divide-y divide-slate-100 overflow-y-auto pr-1">{items.length ? items.map((item) => <div className="px-1 py-4 first:pt-0 last:pb-0" key={item.name}><div className="flex justify-between gap-4"><strong className="break-words text-slate-950">{item.name}</strong><span className="shrink-0 text-sm text-slate-500">{item.count} conta(s)</span></div><div className="mt-2 grid grid-cols-1 gap-2 text-xs sm:grid-cols-3"><span>Aberto: <b>{money.format(item.open)}</b></span><span>Pago: <b>{money.format(item.paid)}</b></span><span>Atrasado: <b className="text-rose-700">{money.format(item.overdue)}</b></span></div></div>) : <p className="px-1 py-5 text-center text-sm text-slate-500">Nenhum dado no período.</p>}</div>
  </CollapsiblePanel>;
}
type ReportAccountSortKey = "amount" | "categoryName" | "dueDate" | "installment" | "invoiceNumber" | "status" | "store" | "supplier";

function ReportTable({ accounts }: { accounts: AccountPayable[] }) {
  const [sort, setSort] = useState<{ direction: SortDirection; key: ReportAccountSortKey }>({ direction: "asc", key: "dueDate" });
  const orderedAccounts = useMemo(() => accounts.toSorted((a, b) => {
    const left = sort.key === "amount" ? parseBRL(a.amount) : sort.key === "dueDate" ? parseDateBR(a.dueDate).getTime() : (a[sort.key] || "");
    const right = sort.key === "amount" ? parseBRL(b.amount) : sort.key === "dueDate" ? parseDateBR(b.dueDate).getTime() : (b[sort.key] || "");
    const comparison = typeof left === "number" && typeof right === "number" ? left - right : String(left).localeCompare(String(right), "pt-BR", { numeric: true, sensitivity: "base" });
    return sort.direction === "asc" ? comparison : -comparison;
  }), [accounts, sort]);
  const requestSort = (key: ReportAccountSortKey) => setSort((current) => ({ direction: current.key === key && current.direction === "asc" ? "desc" : "asc", key }));

  return <CollapsiblePanel defaultOpen description="Contas a pagar filtradas por vencimento, nota, loja, fornecedor e status." eyebrow="Financeiro" storageKey="reports-payments-open" title="Pagamentos do período"><div className="max-h-[460px] overflow-auto"><table className="w-full min-w-[980px] text-left text-sm"><thead className="sticky top-0 z-10 bg-slate-50 text-slate-600"><tr><SortableHeader active={sort.key === "invoiceNumber"} direction={sort.direction} label="Nota" onClick={() => requestSort("invoiceNumber")} className="px-5 py-3" /><SortableHeader active={sort.key === "supplier"} direction={sort.direction} label="Fornecedor" onClick={() => requestSort("supplier")} className="px-5 py-3" /><SortableHeader active={sort.key === "categoryName"} direction={sort.direction} label="Categoria" onClick={() => requestSort("categoryName")} className="px-5 py-3" /><SortableHeader active={sort.key === "store"} direction={sort.direction} label="Loja" onClick={() => requestSort("store")} className="px-5 py-3" /><SortableHeader active={sort.key === "installment"} direction={sort.direction} label="Parcela" onClick={() => requestSort("installment")} className="px-5 py-3" /><SortableHeader active={sort.key === "dueDate"} direction={sort.direction} label="Vencimento" onClick={() => requestSort("dueDate")} className="px-5 py-3" /><SortableHeader active={sort.key === "amount"} direction={sort.direction} label="Valor" onClick={() => requestSort("amount")} className="px-5 py-3" /><SortableHeader active={sort.key === "status"} direction={sort.direction} label="Status" onClick={() => requestSort("status")} className="px-5 py-3" /></tr></thead><tbody className="divide-y divide-slate-100">{orderedAccounts.length ? orderedAccounts.map((item) => <tr key={item.id}><td className="px-5 py-3 font-medium">{item.invoiceNumber || "Sem nota"}</td><td className="px-5 py-3 font-medium">{item.supplier}</td><td className="px-5 py-3">{item.categoryName || "Sem categoria"}</td><td className="px-5 py-3">{item.store}</td><td className="px-5 py-3">{item.installment}</td><td className="px-5 py-3">{item.dueDate}</td><td className="px-5 py-3 font-medium">{item.amount}</td><td className="px-5 py-3">{item.status}</td></tr>) : <tr><td className="px-5 py-8 text-center text-slate-500" colSpan={8}>Nenhum pagamento encontrado.</td></tr>}</tbody></table></div></CollapsiblePanel>;
}

type ReportPurchaseSortKey = "description" | "invoiceNumber" | "issueDate" | "store" | "supplier" | "total";

function PurchasesReportTable({ purchases }: { purchases: Purchase[] }) {
  const [sort, setSort] = useState<{ direction: SortDirection; key: ReportPurchaseSortKey }>({ direction: "desc", key: "issueDate" });
  const orderedPurchases = useMemo(() => purchases.toSorted((a, b) => {
    const left = sort.key === "total" ? parseBRL(a.total) : sort.key === "issueDate" ? parseDateBR(a.issueDate).getTime() : a[sort.key];
    const right = sort.key === "total" ? parseBRL(b.total) : sort.key === "issueDate" ? parseDateBR(b.issueDate).getTime() : b[sort.key];
    const comparison = typeof left === "number" && typeof right === "number" ? left - right : String(left).localeCompare(String(right), "pt-BR", { numeric: true, sensitivity: "base" });
    return sort.direction === "asc" ? comparison : -comparison;
  }), [purchases, sort]);
  const requestSort = (key: ReportPurchaseSortKey) => setSort((current) => ({ direction: current.key === key && current.direction === "asc" ? "desc" : "asc", key }));

  return <CollapsiblePanel description="Notas fiscais e compras lançadas dentro do período selecionado." eyebrow="Compras" storageKey="reports-purchases-open" title="Compras/notas lançadas no período"><div className="max-h-[460px] overflow-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="sticky top-0 z-10 bg-slate-50 text-slate-600"><tr><SortableHeader active={sort.key === "invoiceNumber"} direction={sort.direction} label="Nota" onClick={() => requestSort("invoiceNumber")} className="px-5 py-3" /><SortableHeader active={sort.key === "issueDate"} direction={sort.direction} label="Data" onClick={() => requestSort("issueDate")} className="px-5 py-3" /><SortableHeader active={sort.key === "supplier"} direction={sort.direction} label="Fornecedor" onClick={() => requestSort("supplier")} className="px-5 py-3" /><SortableHeader active={sort.key === "store"} direction={sort.direction} label="Loja" onClick={() => requestSort("store")} className="px-5 py-3" /><SortableHeader active={sort.key === "description"} direction={sort.direction} label="Descrição" onClick={() => requestSort("description")} className="px-5 py-3" /><SortableHeader active={sort.key === "total"} direction={sort.direction} label="Total" onClick={() => requestSort("total")} className="px-5 py-3" /></tr></thead><tbody className="divide-y divide-slate-100">{orderedPurchases.length ? orderedPurchases.map((item) => <tr key={item.id}><td className="px-5 py-3 font-medium">{item.invoiceNumber}</td><td className="px-5 py-3">{item.issueDate}</td><td className="px-5 py-3">{item.supplier}</td><td className="px-5 py-3">{item.store}</td><td className="px-5 py-3">{item.description || "Não informado"}</td><td className="px-5 py-3 font-medium">{item.total}</td></tr>) : <tr><td className="px-5 py-8 text-center text-slate-500" colSpan={6}>Nenhuma compra/nota encontrada.</td></tr>}</tbody></table></div></CollapsiblePanel>;
}
