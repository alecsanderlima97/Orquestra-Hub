import { Download } from "lucide-react";

export function BackupPanel({ data }: { data: Record<string, unknown> }) {
  function downloadBackup() {
    const payload = JSON.stringify({ exportedAt: new Date().toISOString(), version: 1, ...data }, null, 2);
    const url = URL.createObjectURL(new Blob([payload], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `backup-orquestra-hub-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }
  return <article className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><div><h3 className="font-semibold">Backup completo</h3><p className="mt-1 text-sm text-slate-600">Exporta lojas, fornecedores, compras, contas, despesas e auditoria em JSON.</p></div><button className="inline-flex items-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white" onClick={downloadBackup} type="button"><Download size={17} />Baixar backup</button></article>;
}
