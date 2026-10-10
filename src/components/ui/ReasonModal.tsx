import { X } from "lucide-react";
import { useState } from "react";

export function ReasonModal({
  description,
  onCancel,
  onConfirm,
  title,
}: {
  description: string;
  onCancel: () => void;
  onConfirm: (reason: string) => Promise<void> | void;
  title: string;
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleConfirm() {
    const normalizedReason = reason.trim();
    if (!normalizedReason) {
      setError("Informe o motivo para continuar.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onConfirm(normalizedReason);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível concluir a operação.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 px-4" role="presentation">
      <section aria-labelledby="reason-modal-title" aria-modal="true" className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl" role="dialog">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950" id="reason-modal-title">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
          </div>
          <button aria-label="Fechar" className="rounded-md p-2 text-slate-500 hover:bg-slate-100" onClick={onCancel} title="Cancelar operação" type="button">
            <X size={18} />
          </button>
        </div>
        <label className="mt-5 block">
          <span className="text-sm font-medium text-slate-700">Motivo <span aria-hidden="true">*</span></span>
          <textarea
            aria-describedby={error ? "reason-modal-error" : undefined}
            aria-invalid={Boolean(error)}
            aria-required="true"
            className="mt-2 min-h-28 w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200"
            onChange={(event) => setReason(event.target.value)}
            placeholder="Descreva o motivo da alteração"
            value={reason}
          />
        </label>
        {error ? <p className="mt-3 rounded-md bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700" id="reason-modal-error">{error}</p> : null}
        <div className="mt-6 flex justify-end gap-3">
          <button className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100" disabled={saving} onClick={onCancel} type="button">Cancelar</button>
          <button className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60" disabled={saving} onClick={handleConfirm} type="button">
            {saving ? "Salvando..." : "Confirmar operação"}
          </button>
        </div>
      </section>
    </div>
  );
}
