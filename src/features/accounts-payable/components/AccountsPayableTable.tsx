import { CheckCircle2, MessageCircle, Paperclip, Pencil } from "lucide-react";
import { brCurrencyFormatter, parseBRL, parseDateBR, todaySaoPaulo } from "@/lib/formatters/br";
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

export function AccountsPayableTable({
  accounts,
  onMarkPaid,
  onEdit,
  onReceiptSelected,
  onWhatsApp,
}: {
  accounts: AccountPayable[];
  onMarkPaid?: (id: string) => void;
  onEdit?: (account: AccountPayable) => void;
  onReceiptSelected?: (id: string, file: File) => void;
  onWhatsApp?: (account: AccountPayable) => void;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            <th className="px-5 py-3 font-medium">Fornecedor</th>
            <th className="px-5 py-3 font-medium">Loja</th>
            <th className="px-5 py-3 font-medium">Parcela</th>
            <th className="px-5 py-3 font-medium">Vencimento</th>
            <th className="px-5 py-3 font-medium">Valor</th>
            <th className="px-5 py-3 font-medium">Juros/Mora</th>
            <th className="px-5 py-3 font-medium">Status</th>
            <th className="px-5 py-3 font-medium">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {accounts.length ? (
            accounts.map((account) => {
              const label = dueLabel(account);
              const charges = lateCharge(account);
              const days = overdueDays(account);
              return (
                <tr className={rowStyle(account)} key={account.id}>
                  <td className="px-5 py-4 font-medium text-slate-950">{account.supplier}</td>
                  <td className="px-5 py-4 text-slate-700">{account.store}</td>
                  <td className="px-5 py-4 text-slate-700">{account.installment}</td>
                  <td className="px-5 py-4 text-slate-700">
                    <div className="flex flex-col gap-1">
                      <span>{account.dueDate}</span>
                      {label ? <span className="text-xs font-semibold text-rose-700">{label}</span> : null}
                    </div>
                  </td>
                  <td className="px-5 py-4 font-medium text-slate-950">
                    <div className="flex flex-col gap-1">
                      <span>{account.amount}</span>
                      {charges > 0 ? <span className="text-xs font-semibold text-rose-700">Total com atraso: {brCurrencyFormatter.format(parseBRL(account.amount) + charges)}</span> : null}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-700">
                    <div className="flex flex-col gap-1">
                      <span>{charges > 0 ? brCurrencyFormatter.format(charges) : "R$ 0,00"}</span>
                      {charges > 0 ? <span className="text-xs text-slate-500">Mora {account.dailyInterestAmount || "R$ 0,00"} / {account.dailyInterestPercent || "0"}% ao dia · Multa {account.lateFeeAmount || "R$ 0,00"} / {account.lateFeePercent || "0"}%</span> : <span className="text-xs text-slate-500">Sem atraso calculado</span>}
                      {days && account.protestAfterDays ? <span className={`text-xs font-semibold ${days >= Number(account.protestAfterDays) ? "text-rose-700" : "text-slate-500"}`}>Protesto apos {account.protestAfterDays} dia(s)</span> : null}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-1">
                      <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[account.status]}`}>
                        {account.status}
                      </span>
                      {account.paidAt ? <span className="text-xs text-slate-500">Pago em {account.paidAt}</span> : null}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <button aria-label="Editar conta" className="rounded-md border border-slate-200 bg-white p-2 text-slate-700 hover:bg-amber-50 hover:text-amber-800" onClick={() => onEdit?.(account)} title={account.status === "Pago" ? "Editar conta paga mediante confirmação da senha" : "Editar esta conta a pagar"} type="button"><Pencil size={17} /></button>
                      <button
                        aria-label="Dar baixa"
                        className="rounded-md border border-slate-200 bg-white p-2 text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                        disabled={account.status === "Pago"}
                        onClick={() => onMarkPaid?.(account.id)}
                        title="Confirmar que este boleto foi pago e registrar a baixa."
                        type="button"
                      >
                        <CheckCircle2 size={17} />
                      </button>
                      <button aria-label="Enviar pelo WhatsApp" className="rounded-md border border-slate-200 bg-white p-2 text-emerald-700 hover:bg-emerald-50" onClick={() => onWhatsApp?.(account)} title="Abrir alerta ou confirmação no WhatsApp" type="button"><MessageCircle size={17} /></button>
                      <button
                        aria-label="Anexar comprovante"
                        className="relative rounded-md border border-slate-200 bg-white p-2 text-slate-700 hover:bg-slate-100"
                        title="Anexar o comprovante de pagamento desta conta."
                        type="button"
                      >
                        <label className="cursor-pointer">
                          <Paperclip size={17} />
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
                      {account.receiptUrl ? <a className="self-center text-xs font-medium text-emerald-700" href={account.receiptUrl} rel="noreferrer" target="_blank">Comprovante</a> : account.receiptName ? <span className="self-center text-xs font-medium text-emerald-700">Comprovante</span> : null}
                    </div>
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td className="px-5 py-8 text-center text-slate-500" colSpan={8}>
                Nenhuma conta encontrada com os filtros selecionados.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
