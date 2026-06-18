import type { AuditLog } from "../types/auditTypes";

export function AuditPanel({ logs }: { logs: AuditLog[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <h3 className="font-semibold">Últimas alterações</h3>
      </div>
      <div className="divide-y divide-slate-100">
        {logs.length ? logs.map((log) => (
          <div className="flex justify-between gap-4 px-5 py-3 text-sm" key={log.id}>
            <span><strong>{log.userName || log.userEmail}</strong> <span className="text-slate-500">({log.userEmail})</span> {log.action} {log.entity}</span>
            <span className="text-slate-500">{log.entityId}</span>
          </div>
        )) : <p className="px-5 py-6 text-sm text-slate-500">Nenhuma alteração registrada.</p>}
      </div>
    </div>
  );
}
