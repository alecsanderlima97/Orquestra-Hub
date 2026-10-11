import { CheckCircle2, MessageCircle, Paperclip, Pencil, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { SortableHeader, type SortDirection } from "@/components/ui/SortableHeader";
import { brCurrencyFormatter, formatFirebaseDateTime, parseBRL, parseDateBR, todaySaoPaulo } from "@/lib/formatters/br";
import type { AccountPayable } from "../types/accountPayableTypes";

const statusStyles: Record<AccountPayable["status"], string> = {
  Aberto: "bg-amber-100 text-amber-800",
  Atrasado: "bg-rose-100 text-rose-800",
  Pago: "bg-emerald-100 text-emerald-800",
};

function dueLabel(account: AccountPayable) {
  if (account.status === "Pago") return "";
  const today = todaySaoPaulo().getTime();
  const dueDate = parseDateBR(account.dueDate).getTime();
  if (dueDate < today) return "Vencido";
  if (dueDate === today) return "Vence hoje";
  return "";
}

function rowStyle(account: AccountPayable) {
  const label = dueLabel(account);
  if (label === "Vencido") return "bg-rose-50";
  if (label === "Vence hoje") return "bg-amber-50";
  return "";
}

function parsePercent(value?: string) {
  return Number(String(value || "0").replace(",", ".")) / 100;
}

function overdueDays(account: AccountPayable) {
  if (account.status === "Pago" || dueLabel(account) !== "Vencido") return 0;
  const today = todaySaoPaulo().getTime();
  const dueDate = parseDateBR(account.dueDate).getTime();
  return Math.max(Math.floor((today - dueDate) / 86400000), 0);
}

function lateCharge(account: AccountPayable) {
  const days = overdueDays(account);
  if (!days) return 0;
  const amount = parseBRL(account.amount);
  const dailyFixed = parseBRL(account.dailyInterestAmount || "R$ 0,00") * days;
  const dailyPercent = amount * parsePercent(account.dailyInterestPercent) * days;
  const feeFixed = parseBRL(account.lateFeeAmount || "R$ 0,00");
  const feePercent = amount * parsePercent(account.lateFeePercent);
  return dailyFixed + dailyPercent + feeFixed + feePercent;
}

type AccountSortKey = "amount" | "categoryName" | "dueDate" | "installment" | "invoiceNumber" | "status" | "store" | "supplier";

export function AccountsPayableTable({
  accounts,
  onDelete,
  onMarkPaid,
  onEdit,
  onReceiptSelected,
  receiptRequiredOnPayment = false,
  onWhatsApp,
}: {
  accounts: AccountPayable[];
  onDelete?: (account: AccountPayable) => void;
  onMarkPaid?: (id: string) => void;
  onEdit?: (account: AccountPayable) => void;
  onReceiptSelected?: (id: string, file: File) => void;
  receiptRequiredOnPayment?: boolean;
  onWhatsApp?: (account: AccountPayable) => void;
}) {
  const [sort, setSort] = useState<{ direction: SortDirection; key: AccountSortKey }>({ direction: "asc", key: "dueDate" });
  const orderedAccounts = useMemo(() => accounts.toSorted((a, b) => {
    const left = sort.key === "amount" ? parseBRL(a.amount) : sort.key === "dueDate" ? parseDateBR(a.dueDate).getTime() : (a[sort.key] || "");
    const right = sort.key === "amount" ? parseBRL(b.amount) : sort.key === "dueDate" ? parseDateBR(b.dueDate).getTime() : (b[sort.key] || "");
    const comparison = typeof left === "number" && typeof right === "number" ? left - right : String(left).localeCompare(String(right), "pt-BR", { numeric: true, sensitivity: "base" });
    return sort.direction === "asc" ? comparison : -comparison;
  }), [accounts, sort]);
  const requestSort = (key: AccountSortKey) => setSort((current) => ({ direction: current.key === key && current.direction === "asc" ? "desc" : "asc", key }));

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="space-y-3 p-3 lg:hidden">
        {orderedAccounts.length ? orderedAccounts.map((account) => {
          const label = dueLabel(account);
          const charges = lateCharge(account);
          const days = overdueDays(account);
          return (
            <article className={`rounded-lg border border-slate-200 p-4 ${rowStyle(account)}`} key={account.id}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-700">Nota {account.invoiceNumber || "Sem nota"}</p>
                  <h3 className="mt-1 break-words font-semibold text-slate-950">{account.supplier}</h3>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusStyles[account.status]}`}>{account.status}</span>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <div><dt className="text-xs text-slate-500">Vencimento</dt><dd className="mt-1 text-slate-700">{account.dueDate}</dd>{label ? <dd className="mt-1 text-xs font-semibold text-rose-700">{label}</dd> : null}</div>
                <div><dt className="text-xs text-slate-500">Valor</dt><dd className="mt-1 font-semibold text-slate-950">{account.amount}</dd>{charges > 0 ? <dd className="mt-1 text-xs font-semibold text-rose-700">Com atraso: {brCurrencyFormatter.format(parseBRL(account.amount) + charges)}</dd> : null}</div>
                <div><dt className="text-xs text-slate-500">Loja</dt><dd className="mt-1 break-words text-slate-700">{account.store}</dd></div>
                <div><dt className="text-xs text-slate-500">Parcela</dt><dd className="mt-1 text-slate-700">{account.installment}</dd></div>
                <div><dt className="text-xs text-slate-500">Categoria</dt><dd className="mt-1 break-words text-slate-700">{account.categoryName || "Sem categoria"}</dd></div>
                <div><dt className="text-xs text-slate-500">Juros/mora</dt><dd className="mt-1 text-slate-700">{charges > 0 ? brCurrencyFormatter.format(charges) : "R$ 0,00"}</dd>{days && account.protestAfterDays ? <dd className="mt-1 text-xs text-slate-500">Protesto após {account.protestAfterDays} dia(s)</dd> : null}</div>
              </dl>
              {account.paidAt ? <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500">Pago em {formatFirebaseDateTime(account.paidAt)}</p> : null}
              <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                <button aria-label="Editar conta" className="rounded-md border border-slate-200 bg-white p-2 text-slate-700 hover:bg-amber-50 hover:text-amber-800" onClick={() => onEdit?.(account)} title="Editar esta conta a pagar" type="button"><Pencil size={16} /></button>
                <button aria-label="Excluir lançamento" className="rounded-md border border-slate-200 bg-white p-2 text-rose-600 hover:bg-rose-50" onClick={() => onDelete?.(account)} title="Excluir somente este lançamento de conta a pagar" type="button"><Trash2 size={16} /></button>
                <button aria-label="Dar baixa" className="rounded-md border border-slate-200 bg-white p-2 text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50" disabled={account.status === "Pago"} onClick={() => onMarkPaid?.(account.id)} title={receiptRequiredOnPayment && !account.receiptName && !account.receiptPath ? "Anexe o comprovante antes de registrar a baixa." : "Confirmar que este boleto foi pago e registrar a baixa."} type="button"><CheckCircle2 size={16} /></button>
                <button aria-label="Enviar pelo WhatsApp" className="rounded-md border border-slate-200 bg-white p-2 text-emerald-700 hover:bg-emerald-50" onClick={() => onWhatsApp?.(account)} title="Abrir alerta ou confirmação no WhatsApp" type="button"><MessageCircle size={16} /></button>
                <label aria-label="Anexar comprovante" className="cursor-pointer rounded-md border border-slate-200 bg-white p-2 text-slate-700 hover:bg-slate-100" title="Anexar o comprovante de pagamento desta conta."><Paperclip size={16} /><input className="sr-only" onChange={(event) => { const file = event.target.files?.[0]; if (file) onReceiptSelected?.(account.id, file); event.target.value = ""; }} type="file" /></label>
                {account.receiptUrl ? <a className="rounded-md border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700" href={account.receiptUrl} rel="noreferrer" target="_blank">Comprovante</a> : account.receiptName ? <span className="rounded-md border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">Comprovante</span> : null}
                {account.boletoAttachment?.url ? <a className="rounded-md border border-cyan-100 bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-700" href={account.boletoAttachment.url} rel="noreferrer" target="_blank">Boleto {account.installment}</a> : null}
              </div>
            </article>
          );
        }) : <p className="px-2 py-8 text-center text-sm text-slate-500">Nenhuma conta encontrada com os filtros selecionados.</p>}
      </div>

      <div className="hidden overflow-x-auto lg:block">
      <table className="w-full table-fixed text-left text-xs lg:text-sm">
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            <SortableHeader active={sort.key === "invoiceNumber"} direction={sort.direction} label="Nota" onClick={() => requestSort("invoiceNumber")} className="w-[9%] px-3 py-3" />
            <SortableHeader active={sort.key === "supplier"} direction={sort.direction} label="Fornecedor" onClick={() => requestSort("supplier")} className="w-[12%] px-3 py-3" />
            <SortableHeader active={sort.key === "categoryName"} direction={sort.direction} label="Categoria" onClick={() => requestSort("categoryName")} className="w-[10%] px-3 py-3" />
            <SortableHeader active={sort.key === "store"} direction={sort.direction} label="Loja" onClick={() => requestSort("store")} className="w-[11%] px-3 py-3" />
            <SortableHeader active={sort.key === "installment"} direction={sort.direction} label="Parcela" onClick={() => requestSort("installment")} className="w-[7%] px-3 py-3" />
            <SortableHeader active={sort.key === "dueDate"} direction={sort.direction} label="Vencimento" onClick={() => requestSort("dueDate")} className="w-[10%] px-3 py-3" />
            <SortableHeader active={sort.key === "amount"} direction={sort.direction} label="Valor" onClick={() => requestSort("amount")} className="w-[9%] px-3 py-3" />
            <th className="w-[12%] px-3 py-3 font-medium">Juros/Mora</th>
            <SortableHeader active={sort.key === "status"} direction={sort.direction} label="Status" onClick={() => requestSort("status")} className="w-[9%] px-3 py-3" />
            <th className="w-[11%] px-3 py-3 text-center font-medium">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {orderedAccounts.length ? (
            orderedAccounts.map((account) => {
              const label = dueLabel(account);
              const charges = lateCharge(account);
              const days = overdueDays(account);
              return (
                <tr className={rowStyle(account)} key={account.id}>
                  <td className="px-3 py-4 font-medium text-slate-950">{account.invoiceNumber || "Sem nota"}</td>
                  <td className="px-3 py-4 font-medium text-slate-950">{account.supplier}</td>
                  <td className="px-3 py-4 text-slate-700">
                    {account.categoryName ? <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold"><span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: account.categoryColor || "#0891b2" }} /><span className="truncate">{account.categoryName}</span></span> : <span className="text-xs text-slate-400">Sem categoria</span>}
                  </td>
                  <td className="px-3 py-4 text-slate-700">{account.store}</td>
                  <td className="px-3 py-4 text-slate-700">{account.installment}</td>
                  <td className="px-3 py-4 text-slate-700">
                    <div className="flex flex-col gap-1">
                      <span>{account.dueDate}</span>
                      {label ? <span className="text-xs font-semibold text-rose-700">{label}</span> : null}
                    </div>
                  </td>
                  <td className="px-3 py-4 font-medium text-slate-950">
                    <div className="flex flex-col gap-1">
                      <span>{account.amount}</span>
                      {charges > 0 ? <span className="text-xs font-semibold text-rose-700">Total com atraso: {brCurrencyFormatter.format(parseBRL(account.amount) + charges)}</span> : null}
                    </div>
                  </td>
                  <td className="px-3 py-4 text-slate-700">
                    <div className="flex flex-col gap-1">
                      <span>{charges > 0 ? brCurrencyFormatter.format(charges) : "R$ 0,00"}</span>
                      {charges > 0 ? <span className="text-xs text-slate-500">Mora {account.dailyInterestAmount || "R$ 0,00"} / {account.dailyInterestPercent || "0"}% ao dia</span> : <span className="text-xs text-slate-500">Sem atraso</span>}
                      {days && account.protestAfterDays ? <span className={`text-xs font-semibold ${days >= Number(account.protestAfterDays) ? "text-rose-700" : "text-slate-500"}`}>Protesto apos {account.protestAfterDays} dia(s)</span> : null}
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <div className="flex flex-col gap-1">
                      <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[account.status]}`}>
                        {account.status}
                      </span>
                      {account.paidAt ? <span className="text-xs text-slate-500">Pago em {formatFirebaseDateTime(account.paidAt)}</span> : null}
                    </div>
                  </td>
                  <td className="px-3 py-4">
                    <div className="grid grid-cols-3 justify-items-center gap-1">
                      <button aria-label="Editar conta" className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-700 hover:bg-amber-50 hover:text-amber-800" onClick={() => onEdit?.(account)} title={account.status === "Pago" ? "Editar conta paga mediante confirmação da senha" : "Editar esta conta a pagar"} type="button"><Pencil size={16} /></button>
                      <button aria-label="Excluir lançamento" className="rounded-md border border-slate-200 bg-white p-1.5 text-rose-600 hover:bg-rose-50" onClick={() => onDelete?.(account)} title="Excluir somente este lançamento de conta a pagar" type="button"><Trash2 size={16} /></button>
                      <button
                        aria-label="Dar baixa"
                        className="rounded-md border border-slate-200 bg-white p-1.5 text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={account.status === "Pago"}
                        onClick={() => onMarkPaid?.(account.id)}
                        title={receiptRequiredOnPayment && !account.receiptName && !account.receiptPath ? "Anexe o comprovante antes de registrar a baixa." : "Confirmar que este boleto foi pago e registrar a baixa."}
                        type="button"
                      >
                        <CheckCircle2 size={16} />
                      </button>
                      <button aria-label="Enviar pelo WhatsApp" className="rounded-md border border-slate-200 bg-white p-1.5 text-emerald-700 hover:bg-emerald-50" onClick={() => onWhatsApp?.(account)} title="Abrir alerta ou confirmação no WhatsApp" type="button"><MessageCircle size={16} /></button>
                      <button
                        aria-label="Anexar comprovante"
                        className="relative rounded-md border border-slate-200 bg-white p-1.5 text-slate-700 hover:bg-slate-100"
                        title="Anexar o comprovante de pagamento desta conta."
                        type="button"
                      >
                        <label className="cursor-pointer">
                          <Paperclip size={16} />
                          <input
                            className="sr-only"
                            onChange={(event) => {
                              const file = event.target.files?.[0];
                              if (file) onReceiptSelected?.(account.id, file);
                            }}
                            type="file"
                          />
                        </label>
                      </button>
                      {account.receiptUrl ? <a className="col-span-3 text-center text-[11px] font-medium text-emerald-700" href={account.receiptUrl} rel="noreferrer" target="_blank">Comprovante</a> : account.receiptName ? <span className="col-span-3 text-center text-[11px] font-medium text-emerald-700">Comprovante</span> : null}
                      {account.boletoAttachment?.url ? <a className="col-span-3 text-center text-[11px] font-medium text-cyan-700" href={account.boletoAttachment.url} rel="noreferrer" target="_blank">Boleto {account.installment}</a> : null}
                    </div>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td className="px-5 py-8 text-center text-slate-500" colSpan={10}>
                Nenhuma conta encontrada com os filtros selecionados.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div>
    </div>
  );
}
