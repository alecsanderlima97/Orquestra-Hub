"use client";

import { AlertTriangle, CalendarClock, MessageCircle } from "lucide-react";
import { useState } from "react";
import { CollapsiblePanel } from "@/components/ui/CollapsiblePanel";
import { ListVisibilityToggle } from "@/components/ui/ListVisibilityToggle";
import type { FinancialAlert } from "../utils/financialAlerts";

const styles = { Atrasada: "border-rose-200 bg-rose-50 text-rose-900", Hoje: "border-amber-300 bg-amber-50 text-amber-950", Próxima: "border-sky-200 bg-sky-50 text-sky-900", Recorrente: "border-slate-200 bg-slate-50 text-slate-800" };
function deadline(alert: FinancialAlert) { if (alert.days < 0) return `${Math.abs(alert.days)} dia(s) em atraso`; if (alert.days === 0) return "Vence hoje"; return `Vence em ${alert.days} dia(s)`; }
export function FinancialAlertsPanel({ alerts, onWhatsApp, storageKey = "dashboard-financial-alerts-open" }: { alerts: FinancialAlert[]; onWhatsApp?: (alert: FinancialAlert) => void; storageKey?: string }) {
  const [showAll, setShowAll] = useState(false);
  if (!alerts.length) return null;
  const overdue = alerts.filter((item) => item.kind === "Atrasada").length;
  const visibleAlerts = showAll ? alerts : alerts.slice(0, 5);
  return (
    <div className="mt-4">
      <CollapsiblePanel defaultOpen description={`${overdue ? `${overdue} atrasada(s). ` : ""}Contas e despesas que precisam de atenção.`} eyebrow="Atenção" storageKey={storageKey} title="Alertas financeiros">
        <div className={showAll && alerts.length > 5 ? "max-h-[560px] overflow-y-auto pr-1" : ""}>
          <div className="grid gap-3 md:grid-cols-2">
          {visibleAlerts.map((alert) => <article className={`motion-card flex gap-3 rounded-md border p-4 ${styles[alert.kind]}`} key={alert.id}>
            {alert.kind === "Atrasada" ? <AlertTriangle className="shrink-0" size={19} /> : <CalendarClock className="shrink-0" size={19} />}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2"><strong>{alert.title}</strong><span className="text-xs font-semibold">{deadline(alert)}</span></div>
              <p className="mt-1 text-sm opacity-80">{alert.detail}</p>
            </div>
            {alert.sourceId && onWhatsApp ? <button className="shrink-0 rounded-md border border-emerald-300 bg-white p-2 text-emerald-700 hover:bg-emerald-50" onClick={() => onWhatsApp(alert)} title="Enviar lembrete pelo WhatsApp" type="button"><MessageCircle size={18} /></button> : null}
          </article>)}
          </div>
        </div>
        <ListVisibilityToggle expanded={showAll} limit={5} onToggle={() => setShowAll((current) => !current)} total={alerts.length} />
      </CollapsiblePanel>
    </div>
  );
}
