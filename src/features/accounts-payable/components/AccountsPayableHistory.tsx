import type { AuditLog } from "@/features/audit/types/auditTypes";

const financialEntities = new Set(["anexo da nota fiscal", "boleto", "comprovante", "conta", "compra", "despesa fixa"]);
const dateTime = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

function isFinancialLog(log: AuditLog) {
  return log.metadata?.module === "financeiro" || financialEntities.has(log.entity);
}

export function AccountsPayableHistory({ logs }: { logs: AuditLog[] }) {
  const financialLogs = logs.filter(isFinancialLog).slice(0, 10);

  return (
    <section className="mt-5 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <h3 className="font-semibold">Histórico financeiro</h3>
        <p className="mt-1 text-sm text-slate-500">Acompanhe quem lançou, editou, pagou ou anexou documentos.</p>
      </div>
      <div className="divide-y divide-slate-100">
        {financialLogs.length ? financialLogs.map((log) => (
          <article className="px-5 py-3" key={log.id}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm">
              <p><strong>{log.action}</strong> {log.entity} <span className="text-slate-500">por {log.userName || log.userEmail}</span></p>
              {log.createdAt?.seconds ? <time className="shrink-0 text-xs text-slate-500" dateTime={new Date(log.createdAt.seconds * 1000).toISOString()}>{dateTime.format(new Date(log.createdAt.seconds * 1000))}</time> : null}
            </div>
            <p className="mt-1 break-words text-sm text-slate-600">{log.details || `Identificador: ${log.entityId}`}</p>
          </article>
        )) : <p className="px-5 py-6 text-sm text-slate-500">Nenhuma movimentação financeira registrada nesta sessão.</p>}
      </div>
    </section>
  );
}
