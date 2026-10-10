import type { AuditLog } from "../types/auditTypes";

export function AuditPanel({ logs }: { logs: AuditLog[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <h3 className="font-semibold">Últimas alterações</h3>
      </div>
      <div className="max-h-[360px] divide-y divide-slate-100 overflow-y-auto">
        {logs.length ? logs.map((log) => (
          <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 px-5 py-3 text-sm" key={log.id}>
            <span className="min-w-0"><strong>{log.userName || log.userEmail}</strong> <span className="text-slate-500">({log.userEmail})</span> {log.action} {log.entity}<span className="text-slate-500">: {log.details || log.entityId}</span></span>
            {log.createdAt?.seconds ? <time className="shrink-0 text-xs text-slate-500" dateTime={new Date(log.createdAt.seconds * 1000).toISOString()}>{new Date(log.createdAt.seconds * 1000).toLocaleString("pt-BR")}</time> : null}
          </div>
        )) : <p className="px-5 py-6 text-sm text-slate-500">Nenhuma alteração registrada.</p>}
      </div>
    </div>
  );
}
