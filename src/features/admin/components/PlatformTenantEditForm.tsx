"use client";

import { Save, X } from "lucide-react";
import { plans } from "@/features/plans/planRules";
import { formatBRL, formatPhone, toTitleCaseBR } from "@/lib/formatters/br";
import { CommercialCustomerFields } from "./CommercialCustomerFields";
import type { PlatformTenant, SubscriptionStatus } from "../services/platformAdminService";

type Props = {
  onCancel: () => void;
  onChange: (updates: Partial<PlatformTenant>) => void;
  onSave: () => void;
  tenant: PlatformTenant;
};

const statuses: SubscriptionStatus[] = ["trial", "ativo", "pausado", "vencido", "bloqueado", "cancelado"];

export function PlatformTenantEditForm({ onCancel, onChange, onSave, tenant }: Props) {
  return (
    <div aria-labelledby="tenant-edit-title" aria-modal="true" className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-950/40 p-4 sm:p-8" role="dialog">
      <div className="my-auto w-full max-w-5xl rounded-lg border border-slate-200 bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-cyan-100 bg-cyan-50 px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">Cadastro completo do cliente</p>
            <h3 className="mt-1 text-lg font-semibold text-slate-950" id="tenant-edit-title">Editar {tenant.name}</h3>
            <p className="mt-1 text-sm text-slate-600">Altere os dados e salve tudo de uma vez.</p>
          </div>
          <button aria-label="Fechar cadastro do cliente" className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50" onClick={onCancel} title="Fechar" type="button"><X size={18} /></button>
        </header>

        <div className="max-h-[calc(100vh-12rem)] overflow-y-auto px-5 py-5 sm:px-6">
          <div className="grid gap-3 md:grid-cols-4">
            <label className="block md:col-span-2">
              <span className="text-sm font-medium text-slate-700">Nome da empresa</span>
              <input className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950" onBlur={() => onChange({ name: toTitleCaseBR(tenant.name) })} onChange={(event) => onChange({ name: event.target.value })} value={tenant.name} />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Plano</span>
              <select className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950" onChange={(event) => onChange({ planId: event.target.value as PlatformTenant["planId"] })} value={tenant.planId}>
                {Object.values(plans).map((plan) => <option key={plan.id} value={plan.id}>{plan.label}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Situação</span>
              <select className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950" onChange={(event) => onChange({ subscriptionStatus: event.target.value as SubscriptionStatus })} value={tenant.subscriptionStatus}>
                {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Responsável</span>
              <input className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950" onBlur={() => onChange({ contactName: toTitleCaseBR(tenant.contactName || "") })} onChange={(event) => onChange({ contactName: toTitleCaseBR(event.target.value) })} placeholder="Nome do responsável" value={tenant.contactName || ""} />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Telefone/WhatsApp</span>
              <input className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950" onChange={(event) => onChange({ contactPhone: formatPhone(event.target.value) })} placeholder="(00) 00000-0000" value={tenant.contactPhone || ""} />
            </label>
            <label className="block md:col-span-2">
              <span className="text-sm font-medium text-slate-700">E-mail comercial</span>
              <input className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950" onChange={(event) => onChange({ contactEmail: event.target.value.toLowerCase() })} placeholder="cliente@empresa.com" type="email" value={tenant.contactEmail || ""} />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Mensalidade</span>
              <input className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950" onBlur={() => onChange({ monthlyFee: formatBRL(tenant.monthlyFee || plans[tenant.planId].price) })} onChange={(event) => onChange({ monthlyFee: event.target.value })} value={tenant.monthlyFee || ""} />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Dia de vencimento</span>
              <input className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950" maxLength={2} onChange={(event) => onChange({ billingDay: event.target.value.replace(/\D/g, "").slice(0, 2) })} placeholder="Dia" value={tenant.billingDay || ""} />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Próximo vencimento</span>
              <input className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950" onChange={(event) => onChange({ nextBillingDate: event.target.value })} type="date" value={tenant.nextBillingDate || ""} />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Forma de pagamento</span>
              <select className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950" onChange={(event) => onChange({ paymentMethod: event.target.value })} value={tenant.paymentMethod || "PIX"}>
                <option>PIX</option>
                <option>Transferência</option>
                <option>Dinheiro</option>
                <option>Outro</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Data de início</span>
              <input className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950" onChange={(event) => onChange({ startDate: event.target.value })} type="date" value={tenant.startDate || ""} />
            </label>
            <label className="block md:col-span-3">
              <span className="text-sm font-medium text-slate-700">Observações internas</span>
              <input className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950" onChange={(event) => onChange({ commercialNotes: event.target.value })} placeholder="Observações sobre o cliente" value={tenant.commercialNotes || ""} />
            </label>
          </div>

          <CommercialCustomerFields onChange={(updates) => onChange(updates)} value={tenant} />
        </div>

        <footer className="flex flex-col-reverse gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50" onClick={onCancel} type="button"><X size={16} />Cancelar</button>
          <button className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800" onClick={onSave} type="button"><Save size={16} />Salvar alterações</button>
        </footer>
      </div>
    </div>
  );
}
