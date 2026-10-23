import type { AccountPayable } from "../types/accountPayableTypes";
import type { Supplier } from "@/features/suppliers/types/supplierTypes";

export function PaymentConfirmModal({
  account,
  onCancel,
  onConfirm,
  paidAt,
  supplier,
  error,
  saving = false,
}: {
  account: AccountPayable | null;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
  paidAt: string;
  supplier?: Supplier;
  error?: string;
  saving?: boolean;
}) {
  if (!account) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-slate-950">Confirmar baixa</h2>
        <div className="mt-4 space-y-3 text-sm text-slate-700">
          <p>
            <strong className="text-slate-950">Fornecedor:</strong> {account.supplier}
          </p>
          <p>
            <strong className="text-slate-950">Loja:</strong> {account.store}
          </p>
          <p>
            <strong className="text-slate-950">Valor:</strong> {account.amount}
          </p>
          <p>
            <strong className="text-slate-950">Vencimento:</strong> {account.dueDate}
          </p>
          <p>
            <strong className="text-slate-950">Pago em:</strong> {paidAt}
          </p>
          <div className="rounded-md bg-slate-50 p-3">
            <strong className="text-slate-950">Forma sugerida:</strong> {supplier?.paymentMethod || "Não informada"}
            {supplier?.pixKey ? <p className="mt-1">Chave PIX: {supplier.pixKey}</p> : null}
            {supplier?.bank ? <p className="mt-1">Banco: {supplier.bank} | Agência: {supplier.agency || "-"} | Conta: {supplier.account || "-"}</p> : null}
            {supplier?.paymentTerms ? <p className="mt-1">Condição: {supplier.paymentTerms}</p> : null}
          </div>
        </div>
        {error ? <p className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-800" role="alert">{error}</p> : null}
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60" disabled={saving} onClick={onCancel} title="Cancelar a baixa e manter a conta em aberto." type="button">
            Cancelar
          </button>
          <button className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-60" disabled={saving} onClick={() => void onConfirm()} title="Registrar esta conta como paga." type="button">
            {saving ? "Salvando baixa..." : "Confirmar pagamento"}
          </button>
        </div>
      </div>
    </div>
  );
}
