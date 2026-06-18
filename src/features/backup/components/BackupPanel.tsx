"use client";

import { Download, FileJson, Upload } from "lucide-react";
import { useState } from "react";
import type { BackupPayload, BackupRestoreMode, BackupRestorePreview } from "../services/backupRestoreService";
import { parseBackupPayload, previewBackupPayload } from "../services/backupRestoreService";

type BackupPanelProps = {
  data: Record<string, unknown>;
  onImport: (payload: BackupPayload, mode: BackupRestoreMode, password: string) => Promise<void>;
};

const emptyPreview: BackupRestorePreview = { accounts: 0, fixedExpenses: 0, purchases: 0, stores: 0, suppliers: 0 };

export function BackupPanel({ data, onImport }: BackupPanelProps) {
  const [payload, setPayload] = useState<BackupPayload | null>(null);
  const [preview, setPreview] = useState<BackupRestorePreview>(emptyPreview);
  const [mode, setMode] = useState<BackupRestoreMode>("add");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function downloadBackup() {
    const payload = JSON.stringify({ exportedAt: new Date().toISOString(), version: 1, ...data }, null, 2);
    const url = URL.createObjectURL(new Blob([payload], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `backup-orquestra-hub-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function selectFile(file?: File) {
    setMessage("");
    setPayload(null);
    setPreview(emptyPreview);
    if (!file) return;
    try {
      const parsed = parseBackupPayload(await file.text());
      setPayload(parsed);
      setPreview(previewBackupPayload(parsed));
    } catch {
      setMessage("Arquivo inválido. Selecione um backup JSON gerado pelo sistema.");
    }
  }

  async function importBackup() {
    if (!payload) {
      setMessage("Selecione um arquivo de backup antes de importar.");
      return;
    }
    if (!password.trim()) {
      setMessage("Informe sua senha para confirmar a importação.");
      return;
    }
    if (mode === "replace" && !window.confirm("Substituir os dados atuais da empresa por este backup? Esta ação não pode ser desfeita.")) return;
    setLoading(true);
    setMessage("");
    try {
      await onImport(payload, mode, password);
      setMessage("Backup importado com sucesso. Atualize a página para conferir os dados restaurados.");
      setPassword("");
      setPayload(null);
      setPreview(emptyPreview);
    } catch {
      setMessage("Não foi possível importar o backup. Confira o arquivo, sua senha e suas permissões.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="font-semibold">Backup completo</h3>
          <p className="mt-1 text-sm text-slate-600">Exporta e restaura lojas, fornecedores, compras, contas e despesas em JSON.</p>
        </div>
        <button className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white" onClick={downloadBackup} type="button">
          <Download size={17} />Baixar backup
        </button>
      </div>

      <div className="mt-5 border-t border-slate-200 pt-5">
        <div className="flex items-center gap-2">
          <FileJson className="text-cyan-700" size={18} />
          <h4 className="font-semibold">Importar backup</h4>
        </div>
        <p className="mt-1 text-sm text-slate-600">Use apenas arquivos JSON baixados pelo Orquestra Hub. A importação exige senha do Proprietário.</p>

        <div className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
          <input accept="application/json,.json" className="rounded-md border border-slate-300 px-3 py-2 text-sm" onChange={(event) => void selectFile(event.target.files?.[0])} type="file" />
          <select className="rounded-md border border-slate-300 px-3 py-2 text-sm" onChange={(event) => setMode(event.target.value as BackupRestoreMode)} value={mode}>
            <option value="add">Adicionar aos dados atuais</option>
            <option value="replace">Substituir dados atuais</option>
          </select>
        </div>

        {payload ? (
          <div className="mt-4 grid gap-2 rounded-md border border-cyan-100 bg-cyan-50/70 p-4 text-sm text-slate-700 sm:grid-cols-5">
            <p><strong>{preview.stores}</strong><br />lojas</p>
            <p><strong>{preview.suppliers}</strong><br />fornecedores</p>
            <p><strong>{preview.purchases}</strong><br />compras</p>
            <p><strong>{preview.accounts}</strong><br />contas</p>
            <p><strong>{preview.fixedExpenses}</strong><br />despesas</p>
          </div>
        ) : null}

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input className="rounded-md border border-slate-300 px-3 py-2 text-sm sm:max-w-xs" onChange={(event) => setPassword(event.target.value)} placeholder="Senha do Proprietário" type="password" value={password} />
          <button className="inline-flex items-center justify-center gap-2 rounded-md border border-cyan-700 px-4 py-2 text-sm font-semibold text-cyan-800 hover:bg-cyan-50 disabled:opacity-60" disabled={loading} onClick={importBackup} type="button">
            <Upload size={17} />{loading ? "Importando..." : "Importar backup"}
          </button>
        </div>

        {message ? <p className="mt-3 text-sm font-medium text-slate-700">{message}</p> : null}
      </div>
    </article>
  );
}
