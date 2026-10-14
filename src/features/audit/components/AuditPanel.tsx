"use client";

import { useState } from "react";
import { CollapsiblePanel } from "@/components/ui/CollapsiblePanel";
import { DEFAULT_LIST_LIMIT, ListVisibilityToggle } from "@/components/ui/ListVisibilityToggle";
import { firebaseValueToDate } from "@/lib/formatters/br";
import type { AuditLog } from "../types/auditTypes";

export function AuditPanel({ logs }: { logs: AuditLog[] }) {
  const [showAll, setShowAll] = useState(false);
  const visibleLogs = showAll ? logs : logs.slice(0, DEFAULT_LIST_LIMIT);

  return (
    <CollapsiblePanel defaultOpen={false} description="Confira quem fez alterações e quando elas aconteceram." eyebrow="Auditoria" storageKey="audit-latest-changes-open" title="Últimas alterações">
      <div className={showAll && logs.length > DEFAULT_LIST_LIMIT ? "max-h-[560px] overflow-y-auto pr-1" : ""}>
        <div className="divide-y divide-slate-100">
        {visibleLogs.length ? visibleLogs.map((log) => (
          <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 px-5 py-3 text-sm" key={log.id}>
            <span className="min-w-0"><strong>{log.userName || log.userEmail}</strong> <span className="text-slate-500">({log.userEmail})</span> {log.action} {log.entity}<span className="text-slate-500">: {log.details || log.entityId}</span></span>
            {(() => { const createdAt = firebaseValueToDate(log.createdAt); return createdAt ? <time className="shrink-0 text-xs text-slate-500" dateTime={createdAt.toISOString()}>{createdAt.toLocaleString("pt-BR")}</time> : null; })()}
          </div>
        )) : <p className="px-5 py-6 text-sm text-slate-500">Nenhuma alteração registrada.</p>}
        </div>
      </div>
      <ListVisibilityToggle expanded={showAll} onToggle={() => setShowAll((current) => !current)} total={logs.length} />
    </CollapsiblePanel>
  );
}
