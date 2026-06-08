import { Download } from "lucide-react";

export function AccountsPayableExport({ onExport }: { onExport: () => void }) {
  return (
    <div className="mb-4 flex justify-end">
      <button
        className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
        onClick={onExport}
        title="Baixar as contas filtradas em CSV para abrir no Excel."
        type="button"
      >
        <Download size={17} />
        Exportar CSV
      </button>
    </div>
  );
}
