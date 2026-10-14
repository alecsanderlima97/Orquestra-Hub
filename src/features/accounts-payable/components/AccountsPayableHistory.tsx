import type { AuditLog } from "@/features/audit/types/auditTypes";
import { CollapsiblePanel } from "@/components/ui/CollapsiblePanel";
import { DEFAULT_LIST_LIMIT, ListVisibilityToggle } from "@/components/ui/ListVisibilityToggle";
import { useState } from "react";
import { firebaseValueToDate } from "@/lib/formatters/br";

const financialEntities = new Set(["anexo da nota fiscal", "boleto", "comprovante", "conta", "compra", "despesa fixa"]);
const dateTime = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

function isFinancialLog(log: AuditLog) {
  return log.metadata?.module === "financeiro" || financialEntities.has(log.entity);
}

export function AccountsPayableHistory({ logs }: { logs: AuditLog[] }) {
  const [showAll, setShowAll] = useState(false);
  const allFinancialLogs = logs.filter(isFinancialLog);
  const financialLogs = showAll ? allFinancialLogs : allFinancialLogs.slice(0, DEFAULT_LIST_LIMIT);

  return (
    <div className="mt-5">
      <CollapsiblePanel description="Acompanhe quem lançou, editou, pagou ou anexou documentos." eyebrow="Auditoria" storageKey="accounts-payable-history-open" title="Histórico financeiro">
      <div className={showAll && allFinancialLogs.length > DEFAULT_LIST_LIMIT ? "max-h-[560px] divide-y divide-slate-100 overflow-y-auto pr-1" : "divide-y divide-slate-100"}>
        {financialLogs.length ? financialLogs.map((log) => (
          <article className="px-5 py-3" key={log.id}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm">
              <p><strong>{log.action}</strong> {log.entity} <span className="text-slate-500">por {log.userName || log.userEmail}</span></p>
              {(() => { const createdAt = firebaseValueToDate(log.createdAt); return createdAt ? <time className="shrink-0 text-xs text-slate-500" dateTime={createdAt.toISOString()}>{dateTime.format(createdAt)}</time> : null; })()}
            </div>
            <p className="mt-1 break-words text-sm text-slate-600">{log.details || `Identificador: ${log.entityId}`}</p>
          </article>
        )) : <p className="px-5 py-6 text-sm text-slate-500">Nenhuma movimentação financeira registrada nesta sessão.</p>}
      </div>
      <ListVisibilityToggle expanded={showAll} onToggle={() => setShowAll((current) => !current)} total={allFinancialLogs.length} />
      </CollapsiblePanel>
    </div>
  );
}
