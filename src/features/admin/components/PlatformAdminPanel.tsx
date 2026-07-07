"use client";

import { Copy, RefreshCw, Save, TicketPlus } from "lucide-react";
import { useEffect, useState } from "react";
import type { PlanId } from "@/features/plans/planRules";
import { plans } from "@/features/plans/planRules";
import { createCommercialInvite } from "@/features/users/services/inviteService";
import { listPlatformTenants, type PlatformTenant, type SubscriptionStatus, updateTenantSubscription } from "../services/platformAdminService";

const statuses: SubscriptionStatus[] = ["trial", "ativo", "vencido", "bloqueado", "cancelado"];
const graceDays = 5;
const onlineWindowMs = 2 * 60 * 1000;
const dateFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short", timeZone: "America/Sao_Paulo" });

function formatDateTime(ms?: number) {
  return ms ? dateFormatter.format(new Date(ms)) : "Sem registro";
}

function isOnline(ms?: number) {
  return Boolean(ms && Date.now() - ms <= onlineWindowMs);
}

function subscriptionStartFromNextBilling(date: string) {
  if (!date) return "Sem registro";
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 2, day).toLocaleDateString("pt-BR");
}

function daysUntilBilling(date: string) {
  if (!date) return null;
  const [year, month, day] = date.split("-").map(Number);
  const due = new Date(year, month - 1, day).getTime();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((due - today) / 86_400_000);
}

function businessDaysLate(date: string) {
  if (!date) return 0;
  const [year, month, day] = date.split("-").map(Number);
  const due = new Date(year, month - 1, day);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (due.getTime() >= today.getTime()) return 0;
  let count = 0;
  const current = new Date(due);
  current.setDate(current.getDate() + 1);
  while (current.getTime() <= today.getTime()) {
    const weekDay = current.getDay();
    if (weekDay !== 0 && weekDay !== 6) count += 1;
    current.setDate(current.getDate() + 1);
  }
  return count;
}

function billingStatus(item: PlatformTenant) {
  if (["bloqueado", "cancelado"].includes(item.subscriptionStatus)) return { label: "Bloqueio manual", tone: "bg-rose-100 text-rose-800" };
  const days = daysUntilBilling(item.nextBillingDate || "");
  if (days === null) return { label: "Sem vencimento", tone: "bg-slate-100 text-slate-700" };
  const lateBusinessDays = businessDaysLate(item.nextBillingDate || "");
  if (lateBusinessDays > graceDays) return { label: `Bloqueio automatico (${lateBusinessDays} dias uteis em atraso)`, tone: "bg-rose-100 text-rose-800" };
  if (days < 0) return { label: `Em tolerancia: bloqueia em ${graceDays - lateBusinessDays + 1} dia(s) util(eis)`, tone: "bg-amber-100 text-amber-800" };
  if (days === 0) return { label: "Vence hoje", tone: "bg-amber-100 text-amber-800" };
  return { label: `Em dia: vence em ${days} dia(s)`, tone: "bg-emerald-100 text-emerald-800" };
}

export function PlatformAdminPanel() {
  const [inviteBillingDate, setInviteBillingDate] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [invitePlan, setInvitePlan] = useState<PlanId>("medio");
  const [inviteStatus, setInviteStatus] = useState<SubscriptionStatus>("trial");
  const [tenants, setTenants] = useState<PlatformTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    setMessage("");
    try {
      setTenants(await listPlatformTenants());
    } catch {
      setMessage("Não foi possível carregar clientes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let alive = true;
    void listPlatformTenants()
      .then((items) => {
        if (alive) setTenants(items);
      })
      .catch(() => {
        if (alive) setMessage("Não foi possível carregar clientes.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  async function generateCommercialInvite() {
    setMessage("");
    try {
      const invite = await createCommercialInvite(invitePlan, inviteStatus, inviteBillingDate);
      setInviteCode(invite.code);
      setMessage("Convite comercial gerado. Envie o código para a cliente criar a empresa.");
    } catch {
      setMessage("Não foi possível gerar o convite comercial.");
    }
  }

  async function save(item: PlatformTenant) {
    setMessage("");
    try {
      await updateTenantSubscription(item.id, { nextBillingDate: item.nextBillingDate, planId: item.planId, subscriptionStatus: item.subscriptionStatus });
      setMessage("Cliente atualizado com sucesso.");
    } catch {
      setMessage("Não foi possível salvar o cliente.");
    }
  }

  return (
    <section className="rounded-lg border border-amber-200 bg-white shadow-sm">
      <header className="flex flex-col gap-3 border-b border-amber-100 bg-amber-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-semibold text-slate-950">Admin Orquestra.cs</h3>
          <p className="mt-1 text-sm text-slate-600">Controle comercial dos clientes, convites, planos e status de assinatura.</p>
        </div>
        <button className="inline-flex h-10 items-center gap-2 rounded-md border border-amber-300 bg-white px-4 text-sm font-semibold text-amber-900" disabled={loading} onClick={load} type="button">
          <RefreshCw size={16} />Atualizar
        </button>
      </header>

      <div className="border-b border-slate-100 p-5">
        <h4 className="font-semibold">Novo convite comercial</h4>
        <p className="mt-1 text-sm text-slate-600">Use este convite para a cliente criar a própria empresa com o plano liberado por você.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <select className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm" onChange={(event) => setInvitePlan(event.target.value as PlanId)} value={invitePlan}>
            {Object.values(plans).map((plan) => <option key={plan.id} value={plan.id}>{plan.label} - {plan.price}</option>)}
          </select>
          <select className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm" onChange={(event) => setInviteStatus(event.target.value as SubscriptionStatus)} value={inviteStatus}>
            {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
          <input className="h-10 rounded-md border border-slate-300 px-3 text-sm" onChange={(event) => setInviteBillingDate(event.target.value)} type="date" value={inviteBillingDate} />
          <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white" onClick={generateCommercialInvite} type="button">
            <TicketPlus size={16} />Gerar convite
          </button>
        </div>
        {inviteCode ? (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-md border border-cyan-100 bg-cyan-50 px-4 py-3">
            <span className="text-sm text-slate-600">Código:</span>
            <strong className="font-mono text-lg tracking-wider text-slate-950">{inviteCode}</strong>
            <button className="inline-flex items-center gap-2 rounded-md border border-cyan-200 bg-white px-3 py-2 text-xs font-semibold text-cyan-900" onClick={() => navigator.clipboard.writeText(inviteCode)} type="button">
              <Copy size={14} />Copiar
            </button>
          </div>
        ) : null}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1480px] text-left text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-5 py-3">Cliente</th>
              <th className="px-5 py-3">Plano</th>
              <th className="px-5 py-3">Status</th>
              <th className="px-5 py-3">Vencimento</th>
              <th className="px-5 py-3">Inscricao</th>
              <th className="px-5 py-3">Situacao calculada</th>
              <th className="px-5 py-3">Ultimo acesso</th>
              <th className="px-5 py-3">Online</th>
              <th className="px-5 py-3">Créditos IA</th>
              <th className="px-5 py-3">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tenants.map((item) => {
              const calculatedStatus = billingStatus(item);
              const online = isOnline(item.lastSeenAt);
              return (
              <tr key={item.id}>
                <td className="px-5 py-3">
                  <strong>{item.name}</strong>
                  <p className="text-xs text-slate-500">{item.id}</p>
                </td>
                <td className="px-5 py-3">
                  <select className="h-10 rounded-md border border-slate-300 bg-white px-3" onChange={(event) => setTenants((items) => items.map((tenant) => tenant.id === item.id ? { ...tenant, planId: event.target.value as PlanId } : tenant))} value={item.planId}>
                    {Object.values(plans).map((plan) => <option key={plan.id} value={plan.id}>{plan.label}</option>)}
                  </select>
                </td>
                <td className="px-5 py-3">
                  <select className="h-10 rounded-md border border-slate-300 bg-white px-3" onChange={(event) => setTenants((items) => items.map((tenant) => tenant.id === item.id ? { ...tenant, subscriptionStatus: event.target.value as SubscriptionStatus } : tenant))} value={item.subscriptionStatus}>
                    {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </td>
                <td className="px-5 py-3">
                  <input className="h-10 rounded-md border border-slate-300 px-3" onChange={(event) => setTenants((items) => items.map((tenant) => tenant.id === item.id ? { ...tenant, nextBillingDate: event.target.value } : tenant))} type="date" value={item.nextBillingDate || ""} />
                </td>
                <td className="px-5 py-3">{subscriptionStartFromNextBilling(item.nextBillingDate || "")}</td>
                <td className="px-5 py-3">
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${calculatedStatus.tone}`}>{calculatedStatus.label}</span>
                </td>
                <td className="px-5 py-3">{formatDateTime(item.lastAccessAt)}</td>
                <td className="px-5 py-3">
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${online ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"}`}>{online ? "Online agora" : "Offline"}</span>
                </td>
                <td className="px-5 py-3">{item.aiBalance}/{item.aiIncluded}</td>
                <td className="px-5 py-3">
                  <button className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white" onClick={() => save(item)} type="button">
                    <Save size={16} />Salvar
                  </button>
                </td>
              </tr>
              );
            })}
            {!tenants.length ? <tr><td className="px-5 py-8 text-center text-slate-500" colSpan={10}>{loading ? "Carregando clientes..." : "Nenhum cliente encontrado."}</td></tr> : null}
          </tbody>
        </table>
      </div>
      {message ? <p className="border-t border-slate-100 px-5 py-3 text-sm font-medium text-slate-700">{message}</p> : null}
    </section>
  );
}
