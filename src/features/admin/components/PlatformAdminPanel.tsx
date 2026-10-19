"use client";

import { Archive, Check, ChevronDown, ChevronUp, CircleDollarSign, CloudUpload, Copy, Crown, Pause, Pencil, RefreshCw, Save, TicketPlus, UserRound, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";
import { DEFAULT_SUBSCRIPTION_GRACE_DAYS, normalizeSubscriptionGraceDays } from "@/features/billing/subscriptionRules";
import type { PlanId } from "@/features/plans/planRules";
import { plans } from "@/features/plans/planRules";
import { createCommercialInvite } from "@/features/users/services/inviteService";
import { formatBRL, formatPhone, parseBRL, toTitleCaseBR } from "@/lib/formatters/br";
import type { CommercialDocumentType } from "../types/commercialProfile";
import { CommercialCustomerFields } from "./CommercialCustomerFields";
import { PlatformTenantEditForm } from "./PlatformTenantEditForm";
import { confirmTenantPayment, listPlatformTenants, listTenantPayments, syncPortalSnapshot, type PlatformPayment, type PlatformTenant, type PlatformTenantUser, type SubscriptionStatus, updateTenantSubscription } from "../services/platformAdminService";

const statuses: SubscriptionStatus[] = ["trial", "ativo", "pausado", "vencido", "bloqueado", "cancelado"];
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

function formatInputDateBR(date: string) {
  if (!date) return "";
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("pt-BR");
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

function todayInput() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function addOneMonth(date: string) {
  const source = date || todayInput();
  const [year, month, day] = source.split("-").map(Number);
  const next = new Date(year, month, day);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}`;
}

function referenceFromBilling(date: string) {
  const source = date || todayInput();
  const [year, month] = source.split("-").map(Number);
  return `${String(month).padStart(2, "0")}/${year}`;
}

function billingStatus(item: PlatformTenant) {
  const graceDays = normalizeSubscriptionGraceDays(item.graceDays);
  if (["pausado", "bloqueado", "cancelado"].includes(item.subscriptionStatus)) return { label: item.subscriptionStatus === "pausado" ? "Pausado" : "Bloqueio manual", tone: "bg-rose-100 text-rose-800" };
  const days = daysUntilBilling(item.nextBillingDate || "");
  if (days === null) return { label: "Sem vencimento", tone: "bg-slate-100 text-slate-700" };
  const lateBusinessDays = businessDaysLate(item.nextBillingDate || "");
  if (lateBusinessDays > graceDays) return { label: `Bloqueio automatico (${lateBusinessDays} dias uteis em atraso)`, tone: "bg-rose-100 text-rose-800" };
  if (days < 0) return { label: `Em tolerancia: bloqueia em ${graceDays - lateBusinessDays + 1} dia(s) util(eis)`, tone: "bg-amber-100 text-amber-800" };
  if (days === 0) return { label: "Vence hoje", tone: "bg-amber-100 text-amber-800" };
  return { label: `Em dia: vence em ${days} dia(s)`, tone: "bg-emerald-100 text-emerald-800" };
}

function paymentStatusLabel(status?: string) {
  if (status === "paid") return "Pago automaticamente";
  if (status === "pending") return "PIX aguardando";
  if (status === "confirmed") return "PIX confirmado";
  if (status === "overdue") return "Cobrança vencida";
  if (status === "reversed") return "Pagamento estornado";
  return "Sem cobrança PIX";
}

function portalSyncStatusLabel(status?: PlatformTenant["portalSyncStatus"]) {
  if (status === "success") return { label: "Sincronizado", tone: "bg-emerald-100 text-emerald-800" };
  if (status === "error") return { label: "Erro na sincronização", tone: "bg-rose-100 text-rose-800" };
  return { label: "Ainda não sincronizado", tone: "bg-slate-100 text-slate-700" };
}

function PlatformUserRow({ user }: { user: PlatformTenantUser }) {
  const online = isOnline(user.lastSeenAt || user.lastActivityAt);
  return (
    <div className="flex flex-col gap-2 border-t border-slate-100 py-3 first:border-t-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="font-semibold text-slate-900">{user.name}{user.isOwner ? " · Proprietário" : ""}</p>
        <p className="truncate text-xs text-slate-600">{user.email || "Gmail não informado"} · {user.role}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 sm:justify-end">
        <span className={`rounded-full px-2 py-1 font-semibold ${online ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>{online ? "Online" : "Offline"}</span>
        <span>Último acesso: {formatDateTime(user.lastAccessAt)}</span>
        <span>{user.lastDevice || "Dispositivo não informado"}</span>
      </div>
    </div>
  );
}

function PlatformTenantUsers({ tenant }: { tenant: PlatformTenant }) {
  const administrativeUsers = tenant.users.filter((user) => user.userType === "admin");
  const endUsers = tenant.users.filter((user) => user.userType === "end_user");
  const owner = administrativeUsers.find((user) => user.isOwner);
  const collaborators = administrativeUsers.filter((user) => !user.isOwner);
  const userLimit = plans[tenant.planId].userLimit;
  const usedAdministrativeUsers = administrativeUsers.length + tenant.activeInviteCount;

  return (
    <details className="mt-3 overflow-hidden rounded-md border border-cyan-100 bg-cyan-50/30">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-xs font-semibold text-cyan-900 hover:bg-cyan-50">
        <span className="inline-flex items-center gap-2"><UsersRound size={14} />Usuários e acessos</span>
        <span className="rounded-full bg-white px-2 py-1 text-[11px]">Administrativos: {usedAdministrativeUsers}/{userLimit}</span>
      </summary>
      <div className="border-t border-cyan-100 bg-white px-3 py-2">
        <div className="flex items-start gap-3 rounded-md border border-cyan-100 bg-cyan-50/50 p-3">
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-cyan-100 text-cyan-800"><Crown size={15} /></span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-cyan-800">Responsável principal</p>
            <p className="mt-1 font-semibold text-slate-950">{owner?.name || tenant.contactName || "Responsável não informado"}</p>
            <p className="truncate text-xs text-slate-600">{owner?.email || tenant.contactEmail || "Gmail não informado"}</p>
          </div>
        </div>

        <div className="mt-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Colaboradores administrativos</p>
            <span className="text-[11px] text-slate-500">{collaborators.length} cadastrado(s) · {tenant.activeInviteCount} convite(s) pendente(s)</span>
          </div>
          {collaborators.length ? collaborators.map((user) => <PlatformUserRow key={user.id} user={user} />) : <p className="py-3 text-xs text-slate-500">Nenhum colaborador administrativo cadastrado.</p>}
        </div>

        <div className="mt-3 border-t border-slate-100 pt-3">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500"><UserRound size={14} />Usuários finais</p>
          {endUsers.length ? <div className="mt-1">{endUsers.slice(0, 8).map((user) => <PlatformUserRow key={user.id} user={user} />)}{endUsers.length > 8 ? <p className="pt-2 text-xs text-slate-500">Mais {endUsers.length - 8} usuário(s) final(is) sincronizado(s).</p> : null}</div> : <p className="mt-2 text-xs text-slate-500">Nenhum usuário final classificado neste sistema.</p>}
        </div>
      </div>
    </details>
  );
}

function PlatformTenantDetails({ tenant }: { tenant: PlatformTenant }) {
  const syncStatus = portalSyncStatusLabel(tenant.portalSyncStatus);
  const administrativeLimit = plans[tenant.planId].userLimit;
  const administrativeUsed = tenant.adminUserCount + tenant.activeInviteCount;

  return (
    <details className="overflow-hidden rounded-lg border border-cyan-100 bg-white shadow-sm">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 bg-cyan-50/50 px-4 py-3 text-sm font-semibold text-cyan-950 transition hover:bg-cyan-50">
        <span className="min-w-0">
          <span className="block truncate">Detalhes operacionais</span>
          <span className="mt-0.5 block truncate text-xs font-normal text-slate-600">{tenant.name} · atualização {formatDateTime(tenant.updatedAt)}</span>
        </span>
        <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-cyan-800">Abrir detalhes</span>
      </summary>
      <div className="grid gap-4 border-t border-cyan-100 bg-slate-50/40 p-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <section className="min-w-0 overflow-hidden rounded-lg border border-cyan-100 bg-white" aria-label={`Sincronização do ${tenant.name}`}>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cyan-100 bg-cyan-50/60 px-3 py-3">
            <h4 className="text-xs font-bold uppercase tracking-wide text-cyan-950">Sincronização com Portal</h4>
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${syncStatus.tone}`}>{syncStatus.label}</span>
          </div>
          <dl className="grid gap-3 p-3 text-xs sm:grid-cols-2">
            <div className="min-w-0 sm:col-span-2">
              <dt className="font-semibold text-slate-500">Identificador externo</dt>
              <dd className="mt-1 break-all rounded-md bg-slate-50 px-2 py-1 font-mono text-[11px] text-cyan-900">{tenant.externalCustomerId}</dd>
            </div>
            <div className="min-w-0">
              <dt className="font-semibold text-slate-500">ID interno</dt>
              <dd className="mt-1 break-all text-slate-700">{tenant.id}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">dataVersion</dt>
              <dd className="mt-1 font-semibold text-slate-800">{tenant.dataVersion || 1}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">Última atualização</dt>
              <dd className="mt-1 text-slate-700">{formatDateTime(tenant.updatedAt)}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-500">Última sincronização</dt>
              <dd className="mt-1 text-slate-700">{formatDateTime(tenant.portalLastSyncedAt)}</dd>
            </div>
            {tenant.portalSyncError ? (
              <div className="rounded-md border border-rose-100 bg-rose-50 p-2 text-rose-800 sm:col-span-2">
                <dt className="font-semibold">Erro da última sincronização</dt>
                <dd className="mt-1 break-words">{tenant.portalSyncError}</dd>
              </div>
            ) : null}
          </dl>
        </section>

        <div className="min-w-0">
          <PlatformTenantUsers tenant={tenant} />
          <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-600">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold text-slate-700">Limite administrativo do plano</span>
              <span className="rounded-full bg-cyan-50 px-2.5 py-1 font-semibold text-cyan-800">{administrativeUsed}/{administrativeLimit} usados</span>
            </div>
            <p className="mt-2 break-words">Usuários finais ficam vinculados ao cliente, mas não consomem as vagas de colaboradores administrativos.</p>
          </div>
        </div>
      </div>
    </details>
  );
}

export function PlatformAdminPanel() {
  const [commercialForm, setCommercialForm] = useState({
    address: "",
    addressComplement: "",
    addressNumber: "",
    billingDay: "",
    city: "",
    commercialNotes: "",
    contactEmail: "",
    contactName: "",
    contactPhone: "",
    document: "",
    documentType: "CNPJ" as CommercialDocumentType,
    legalName: "",
    mapUrl: "",
    monthlyFee: plans.medio.price,
    graceDays: DEFAULT_SUBSCRIPTION_GRACE_DAYS,
    neighborhood: "",
    paymentMethod: "PIX",
    startDate: todayInput(),
    state: "",
    tradeName: "",
  });
  const [inviteBillingDate, setInviteBillingDate] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [invitePlan, setInvitePlan] = useState<PlanId>("medio");
  const [inviteStatus, setInviteStatus] = useState<SubscriptionStatus>("trial");
  const [editingTenantId, setEditingTenantId] = useState("");
  const [commercialInviteOpen, setCommercialInviteOpen] = useState(false);
  const [tenants, setTenants] = useState<PlatformTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [syncingPortal, setSyncingPortal] = useState(false);
  const [paymentTenantId, setPaymentTenantId] = useState("");
  const [paymentForm, setPaymentForm] = useState({ amount: "", method: "PIX", nextBillingDate: "", notes: "", paidAt: todayInput(), referenceMonth: "" });
  const [paymentsByTenant, setPaymentsByTenant] = useState<Record<string, PlatformPayment[]>>({});
  const editingTenant = editingTenantId ? tenants.find((tenant) => tenant.id === editingTenantId) : undefined;
  const activeTenants = tenants.filter((tenant) => tenant.subscriptionStatus !== "cancelado");
  const inactiveTenants = tenants.filter((tenant) => tenant.subscriptionStatus === "cancelado");

  async function load() {
    setLoading(true);
    setMessage("");
    try {
      setTenants(await listPlatformTenants());
      setLastUpdatedAt(Date.now());
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
        if (alive) {
          setTenants(items);
          setLastUpdatedAt(Date.now());
        }
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
      const invite = await createCommercialInvite(invitePlan, inviteStatus, inviteBillingDate, commercialForm);
      setInviteCode(invite.code);
      setMessage("Convite comercial gerado. Envie o código para a cliente criar a empresa.");
    } catch {
      setMessage("Não foi possível gerar o convite comercial.");
    }
  }

  async function synchronizePortal() {
    setSyncingPortal(true);
    setMessage("");
    try {
      const result = await syncPortalSnapshot();
      const summary = result.summary;
      await load();
      setMessage(`Portal sincronizado: ${summary.clientCount} cliente(s), ${summary.userCount} usuário(s), ${summary.onlineUserCount} online. Snapshot ${summary.contractVersion}, dataVersion ${summary.dataVersion}.`);
    } catch (error) {
      await load();
      setMessage(error instanceof Error ? error.message : "Não foi possível sincronizar o Portal Orquestra.cs.");
    } finally {
      setSyncingPortal(false);
    }
  }

  async function save(item: PlatformTenant) {
    setMessage("");
    try {
      await updateTenantSubscription(item.id, {
        address: item.address,
        addressComplement: item.addressComplement,
        addressNumber: item.addressNumber,
        billingDay: item.billingDay,
        cep: item.cep,
        city: item.city,
        commercialNotes: item.commercialNotes,
        contactEmail: item.contactEmail,
        contactName: item.contactName,
        contactPhone: item.contactPhone,
        document: item.document,
        documentType: item.documentType,
        graceDays: normalizeSubscriptionGraceDays(item.graceDays),
        legalName: item.legalName,
        mapUrl: item.mapUrl,
        monthlyFee: item.monthlyFee,
        name: item.name,
        neighborhood: item.neighborhood,
        nextBillingDate: item.nextBillingDate,
        paymentMethod: item.paymentMethod,
        planId: item.planId,
        startDate: item.startDate,
        state: item.state,
        subscriptionStatus: item.subscriptionStatus,
        tradeName: item.tradeName,
      });
      setEditingTenantId("");
      setMessage("Cliente atualizado com sucesso.");
    } catch {
      setMessage("Não foi possível salvar o cliente.");
    }
  }

  function updateTenantLocal(tenantId: string, updates: Partial<PlatformTenant>) {
    setTenants((items) => items.map((tenant) => tenant.id === tenantId ? { ...tenant, ...updates } : tenant));
  }

  async function changeStatus(item: PlatformTenant, subscriptionStatus: SubscriptionStatus) {
    const action = subscriptionStatus === "pausado" ? "pausar" : subscriptionStatus === "cancelado" ? "remover" : "reativar";
    if (!window.confirm(`Deseja ${action} o cliente ${item.name}? Os dados serao preservados.`)) return;
    const next = { ...item, subscriptionStatus };
    updateTenantLocal(item.id, { subscriptionStatus });
    await save(next);
  }

  async function openPayment(item: PlatformTenant) {
    setMessage("");
    setPaymentTenantId(item.id);
    setPaymentForm({
      amount: item.monthlyFee || plans[item.planId].price,
      method: "PIX",
      nextBillingDate: addOneMonth(item.nextBillingDate || todayInput()),
      notes: "",
      paidAt: todayInput(),
      referenceMonth: referenceFromBilling(item.nextBillingDate || todayInput()),
    });
    if (!paymentsByTenant[item.id]) {
      try {
        const payments = await listTenantPayments(item.id);
        setPaymentsByTenant((current) => ({ ...current, [item.id]: payments }));
      } catch {
        setMessage("Não foi possível carregar o histórico de pagamentos.");
      }
    }
  }

  async function confirmPayment(item: PlatformTenant) {
    if (!paymentForm.amount || parseBRL(paymentForm.amount) <= 0) {
      setMessage("Informe o valor pago antes de confirmar.");
      return;
    }
    if (!paymentForm.paidAt || !paymentForm.nextBillingDate || !paymentForm.referenceMonth.trim()) {
      setMessage("Informe data do pagamento, referência e próximo vencimento.");
      return;
    }
    if (!window.confirm(`Confirmar pagamento de ${item.name} e liberar o sistema até ${paymentForm.nextBillingDate}?`)) return;
    setMessage("");
    try {
      const payment = {
        amount: paymentForm.amount,
        method: paymentForm.method,
        nextBillingDate: paymentForm.nextBillingDate,
        notes: paymentForm.notes.trim(),
        paidAt: paymentForm.paidAt,
        planId: item.planId,
        referenceMonth: paymentForm.referenceMonth.trim(),
      };
      await confirmTenantPayment(item.id, payment);
      const savedPayment: PlatformPayment = { ...payment, id: crypto.randomUUID() };
      setPaymentsByTenant((current) => ({ ...current, [item.id]: [savedPayment, ...(current[item.id] || [])] }));
      updateTenantLocal(item.id, { nextBillingDate: payment.nextBillingDate, subscriptionStatus: "ativo" });
      setPaymentTenantId("");
      setMessage("Pagamento confirmado. Cliente liberado e vencimento atualizado.");
    } catch {
      setMessage("Não foi possível confirmar o pagamento.");
    }
  }

  return (
    <section className="rounded-lg border border-amber-200 bg-white shadow-sm">
      <header className="flex flex-col gap-3 border-b border-amber-100 bg-amber-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-semibold text-slate-950">Admin Orquestra.cs</h3>
          <p className="mt-1 text-sm text-slate-600">Controle comercial dos clientes, convites, planos e status de assinatura.</p>
          <p className="mt-2 inline-flex w-fit rounded-md bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900">
            Clientes sem configuração usam tolerância de {DEFAULT_SUBSCRIPTION_GRACE_DAYS} dias úteis
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3">
          {lastUpdatedAt ? <span aria-live="polite" className="text-xs text-slate-500">Atualizado às {formatDateTime(lastUpdatedAt)}</span> : null}
          <button aria-label="Sincronizar dados com o Portal Orquestra.cs" className="inline-flex h-10 items-center gap-2 rounded-md border border-cyan-300 bg-cyan-50 px-4 text-sm font-semibold text-cyan-900 transition hover:border-cyan-400 hover:bg-cyan-100 active:scale-[0.98] disabled:cursor-wait disabled:opacity-70" disabled={syncingPortal || loading} onClick={() => void synchronizePortal()} type="button">
            <CloudUpload className={syncingPortal ? "animate-pulse" : ""} size={16} />
            {syncingPortal ? "Sincronizando..." : "Sincronizar Portal"}
          </button>
          <button aria-label="Atualizar lista de clientes" className="inline-flex h-10 items-center gap-2 rounded-md border border-amber-300 bg-white px-4 text-sm font-semibold text-amber-900 transition hover:border-amber-400 hover:bg-amber-50 active:scale-[0.98] disabled:cursor-wait disabled:opacity-70" disabled={loading} onClick={load} type="button">
            {loading ? <RefreshCw className="animate-spin" size={16} /> : lastUpdatedAt ? <Check size={16} /> : <RefreshCw size={16} />}
            {loading ? "Atualizando..." : lastUpdatedAt ? "Atualizado" : "Atualizar"}
          </button>
        </div>
      </header>

      <div className="border-b border-slate-100">
        <button aria-expanded={commercialInviteOpen} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left hover:bg-cyan-50/40" onClick={() => setCommercialInviteOpen((open) => !open)} type="button">
          <span className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-cyan-50 text-cyan-700"><TicketPlus size={17} /></span>
            <span>
              <span className="block font-semibold text-slate-950">Novo cliente e convite comercial</span>
              <span className="mt-1 block text-sm text-slate-600">Abra para cadastrar os dados completos e gerar o convite de acesso.</span>
            </span>
          </span>
          {commercialInviteOpen ? <ChevronUp className="shrink-0 text-cyan-700" size={19} /> : <ChevronDown className="shrink-0 text-cyan-700" size={19} />}
        </button>

        {commercialInviteOpen ? <div className="px-5 pb-5">
        <div className="mt-1 grid gap-3 md:grid-cols-4">
          <select className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm" onChange={(event) => {
            const nextPlan = event.target.value as PlanId;
            setInvitePlan(nextPlan);
            setCommercialForm((form) => ({ ...form, monthlyFee: plans[nextPlan].price }));
          }} value={invitePlan}>
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
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <input className="h-10 rounded-md border border-slate-300 px-3 text-sm" onBlur={() => setCommercialForm((form) => ({ ...form, contactName: toTitleCaseBR(form.contactName) }))} onChange={(event) => setCommercialForm((form) => ({ ...form, contactName: toTitleCaseBR(event.target.value) }))} placeholder="Responsável pelo contrato" value={commercialForm.contactName} />
          <input className="h-10 rounded-md border border-slate-300 px-3 text-sm" onChange={(event) => setCommercialForm((form) => ({ ...form, contactPhone: formatPhone(event.target.value) }))} placeholder="WhatsApp" value={commercialForm.contactPhone} />
          <input className="h-10 rounded-md border border-slate-300 px-3 text-sm" onChange={(event) => setCommercialForm((form) => ({ ...form, contactEmail: event.target.value.toLowerCase() }))} placeholder="E-mail comercial" type="email" value={commercialForm.contactEmail} />
          <input className="h-10 rounded-md border border-slate-300 px-3 text-sm" onBlur={() => setCommercialForm((form) => ({ ...form, monthlyFee: formatBRL(form.monthlyFee) }))} onChange={(event) => setCommercialForm((form) => ({ ...form, monthlyFee: event.target.value }))} placeholder="Mensalidade" value={commercialForm.monthlyFee} />
          <input className="h-10 rounded-md border border-slate-300 px-3 text-sm" inputMode="numeric" max="60" min="0" onChange={(event) => setCommercialForm((form) => ({ ...form, graceDays: Number(event.target.value) }))} placeholder="Tolerância (dias úteis)" title="Dias úteis após o vencimento antes do bloqueio automático" type="number" value={commercialForm.graceDays} />
          <input className="h-10 rounded-md border border-slate-300 px-3 text-sm" maxLength={2} onChange={(event) => setCommercialForm((form) => ({ ...form, billingDay: event.target.value.replace(/\D/g, "").slice(0, 2) }))} placeholder="Dia venc." value={commercialForm.billingDay} />
          <select className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm" onChange={(event) => setCommercialForm((form) => ({ ...form, paymentMethod: event.target.value }))} value={commercialForm.paymentMethod}>
            <option>PIX</option>
            <option>Transferência</option>
            <option>Dinheiro</option>
            <option>Outro</option>
          </select>
          <input className="h-10 rounded-md border border-slate-300 px-3 text-sm" onChange={(event) => setCommercialForm((form) => ({ ...form, startDate: event.target.value }))} title="Data de início do cliente" type="date" value={commercialForm.startDate} />
          <input className="h-10 rounded-md border border-slate-300 px-3 text-sm md:col-span-2" onChange={(event) => setCommercialForm((form) => ({ ...form, commercialNotes: event.target.value }))} placeholder="Observações internas do cliente" value={commercialForm.commercialNotes} />
        </div>
        <CommercialCustomerFields onChange={(updates) => setCommercialForm((form) => ({ ...form, ...updates }))} value={commercialForm} />
        {inviteCode ? (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-md border border-cyan-100 bg-cyan-50 px-4 py-3">
            <span className="text-sm text-slate-600">Código:</span>
            <strong className="font-mono text-lg tracking-wider text-slate-950">{inviteCode}</strong>
            <button className="inline-flex items-center gap-2 rounded-md border border-cyan-200 bg-white px-3 py-2 text-xs font-semibold text-cyan-900" onClick={() => navigator.clipboard.writeText(inviteCode)} type="button">
              <Copy size={14} />Copiar
            </button>
          </div>
        ) : null}
        <div className="mt-4 flex flex-col-reverse justify-end gap-2 sm:flex-row">
          <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50" onClick={() => setCommercialInviteOpen(false)} type="button">Cancelar</button>
        </div>
        </div> : null}
      </div>

      {editingTenant ? <PlatformTenantEditForm
        onCancel={() => { setEditingTenantId(""); void load(); }}
        onChange={(updates) => updateTenantLocal(editingTenant.id, updates)}
        onSave={() => void save(editingTenant)}
        tenant={editingTenant}
      /> : null}

      <div className="overflow-x-auto">
        <table className="w-full table-fixed text-left text-xs sm:text-sm">
          <colgroup>
            <col className="w-[29%] xl:w-[25%] 2xl:w-[20%]" />
            <col className="w-[13%] xl:w-[10%] 2xl:w-[8%]" />
            <col className="w-[10%] xl:w-[8%] 2xl:w-[7%]" />
            <col className="hidden w-[10%] xl:table-column xl:w-[10%] 2xl:w-[9%]" />
            <col className="w-[13%] xl:w-[10%] 2xl:w-[9%]" />
            <col className="w-[15%] xl:w-[17%] 2xl:w-[12%]" />
            <col className="hidden w-[10%] 2xl:table-column 2xl:w-[10%]" />
            <col className="hidden w-[7%] 2xl:table-column 2xl:w-[7%]" />
            <col className="hidden w-[7%] 2xl:table-column 2xl:w-[7%]" />
            <col className="w-[20%] 2xl:w-[11%]" />
          </colgroup>
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="px-5 py-3">Cliente</th>
              <th className="px-5 py-3">Plano</th>
              <th className="px-5 py-3">Status</th>
              <th className="hidden px-5 py-3 xl:table-cell">Inscricao</th>
              <th className="px-5 py-3">Vencimento</th>
              <th className="px-5 py-3">Situacao calculada</th>
              <th className="hidden px-5 py-3 2xl:table-cell">Ultimo acesso</th>
              <th className="hidden px-5 py-3 2xl:table-cell">Online</th>
              <th className="hidden px-5 py-3 2xl:table-cell">Créditos IA</th>
              <th className="px-5 py-3">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {activeTenants.map((item) => {
              const calculatedStatus = billingStatus(item);
              const online = isOnline(item.lastSeenAt);
              return [
              <tr className="align-top" key={item.id}>
                <td className="min-w-0 px-4 py-3 sm:px-5">
                  <div className="min-w-0 space-y-1">
                    <button className="block max-w-full truncate text-left font-semibold text-cyan-800 underline-offset-2 hover:text-cyan-950 hover:underline" onClick={() => setEditingTenantId(item.id)} title={item.name} type="button">{item.name}</button>
                    <p className="max-w-full truncate text-xs text-slate-600" title={item.contactName || "Responsável não informado"}>{item.contactName || "Responsável não informado"}</p>
                    <p className="max-w-full truncate text-xs text-slate-500" title={item.contactPhone || item.contactEmail || "Contato não informado"}>{item.contactPhone || item.contactEmail || "Contato não informado"}</p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className="rounded-full bg-cyan-50 px-2 py-1 text-[11px] font-semibold text-cyan-800">{paymentStatusLabel(item.billingStatus)}</span>
                      <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${online ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>{online ? "Online" : "Offline"}</span>
                    </div>
                  </div>
                </td>
                <td className="break-words px-4 py-3 sm:px-5">
                  <span className="font-medium text-slate-950">{plans[item.planId].label}</span>
                </td>
                <td className="px-4 py-3 sm:px-5">
                  <span className="capitalize text-slate-700">{item.subscriptionStatus}</span>
                </td>
                <td className="hidden px-4 py-3 xl:table-cell sm:px-5">{item.startDate ? formatInputDateBR(item.startDate) : subscriptionStartFromNextBilling(item.nextBillingDate || "")}</td>
                <td className="px-4 py-3 sm:px-5">
                  {item.nextBillingDate ? formatInputDateBR(item.nextBillingDate) : "Sem vencimento"}
                </td>
                <td className="px-4 py-3 sm:px-5">
                  <span className={`inline-flex max-w-full rounded-full px-3 py-1 text-xs font-semibold leading-4 ${calculatedStatus.tone}`}>{calculatedStatus.label}</span>
                </td>
                <td className="hidden px-4 py-3 2xl:table-cell sm:px-5">{formatDateTime(item.lastAccessAt)}</td>
                <td className="hidden px-4 py-3 2xl:table-cell sm:px-5">
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${online ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"}`}>{online ? "Online agora" : "Offline"}</span>
                </td>
                <td className="hidden px-4 py-3 2xl:table-cell sm:px-5">{item.aiBalance}/{item.aiIncluded}</td>
                <td className="min-w-[148px] px-3 py-3 align-top sm:px-4">
                  <div className="mx-auto flex max-w-[176px] min-w-0 flex-col gap-2">
                    <button aria-label={`Abrir cadastro de ${item.name}`} className="inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-md border border-cyan-200 bg-cyan-50 px-2.5 py-2 text-xs font-semibold leading-tight text-cyan-800 transition duration-150 hover:-translate-y-0.5 hover:bg-cyan-100 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400" onClick={() => setEditingTenantId(item.id)} title="Abrir e editar cadastro" type="button"><Pencil size={15} /><span className="text-center">Abrir cadastro</span></button>
                    <button aria-label={`Confirmar pagamento de ${item.name}`} className="inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-2 text-xs font-semibold leading-tight text-emerald-800 transition duration-150 hover:-translate-y-0.5 hover:bg-emerald-100 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400" onClick={() => openPayment(item)} title="Registrar pagamento e atualizar vencimento" type="button"><CircleDollarSign size={15} /><span className="text-center">Confirmar pagamento</span></button>
                    <div className="grid grid-cols-2 gap-2">
                      <button aria-label={`Pausar ${item.name}`} className="inline-flex min-h-9 min-w-0 items-center justify-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-1.5 py-2 text-[11px] font-semibold leading-tight text-amber-800 transition duration-150 hover:-translate-y-0.5 hover:bg-amber-100 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400" onClick={() => changeStatus(item, "pausado")} title="Pausar acesso preservando os dados" type="button"><Pause size={13} /><span className="text-center">Pausar</span></button>
                      <button aria-label={`Remover ${item.name}`} className="inline-flex min-h-9 min-w-0 items-center justify-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-1.5 py-2 text-[11px] font-semibold leading-tight text-rose-700 transition duration-150 hover:-translate-y-0.5 hover:bg-rose-100 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400" onClick={() => changeStatus(item, "cancelado")} title="Remover da lista ativa e preservar os dados" type="button"><Archive size={13} /><span className="text-center">Remover</span></button>
                    </div>
                  </div>
                </td>
              </tr>,
              <tr key={`${item.id}-details`}>
                <td className="px-4 pb-4 sm:px-5" colSpan={10}>
                  <PlatformTenantDetails tenant={item} />
                </td>
              </tr>,
              paymentTenantId === item.id ? (
                <tr key={`${item.id}-payment`}>
                  <td className="bg-emerald-50/60 px-5 py-4" colSpan={10}>
                    <div className="rounded-lg border border-emerald-100 bg-white p-4 shadow-sm">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h4 className="font-semibold text-slate-950">Confirmar pagamento mensal</h4>
                          <p className="mt-1 text-sm text-slate-600">Registra o pagamento, libera o cliente e atualiza o próximo vencimento.</p>
                        </div>
                        <button className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700" onClick={() => setPaymentTenantId("")} type="button">Fechar</button>
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-6">
                        <label className="block">
                          <span className="text-xs font-semibold uppercase text-slate-500">Valor pago</span>
                          <input className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm" onBlur={() => setPaymentForm((form) => ({ ...form, amount: formatBRL(form.amount) }))} onChange={(event) => setPaymentForm((form) => ({ ...form, amount: event.target.value }))} value={paymentForm.amount} />
                        </label>
                        <label className="block">
                          <span className="text-xs font-semibold uppercase text-slate-500">Referência</span>
                          <input className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm" onChange={(event) => setPaymentForm((form) => ({ ...form, referenceMonth: event.target.value }))} placeholder="08/2026" value={paymentForm.referenceMonth} />
                        </label>
                        <label className="block">
                          <span className="text-xs font-semibold uppercase text-slate-500">Pago em</span>
                          <input className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm" onChange={(event) => setPaymentForm((form) => ({ ...form, paidAt: event.target.value }))} type="date" value={paymentForm.paidAt} />
                        </label>
                        <label className="block">
                          <span className="text-xs font-semibold uppercase text-slate-500">Próximo vencimento</span>
                          <input className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm" onChange={(event) => setPaymentForm((form) => ({ ...form, nextBillingDate: event.target.value }))} type="date" value={paymentForm.nextBillingDate} />
                        </label>
                        <label className="block">
                          <span className="text-xs font-semibold uppercase text-slate-500">Forma</span>
                          <select className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm" onChange={(event) => setPaymentForm((form) => ({ ...form, method: event.target.value }))} value={paymentForm.method}>
                            <option>PIX</option>
                            <option>Transferência</option>
                            <option>Dinheiro</option>
                            <option>Outro</option>
                          </select>
                        </label>
                        <button className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800" onClick={() => confirmPayment(item)} type="button">
                          <Save size={15} />Confirmar
                        </button>
                      </div>
                      <label className="mt-3 block">
                        <span className="text-xs font-semibold uppercase text-slate-500">Observação</span>
                        <input className="mt-1 h-10 w-full rounded-md border border-slate-300 px-3 text-sm" onChange={(event) => setPaymentForm((form) => ({ ...form, notes: event.target.value }))} placeholder="Ex.: pagamento confirmado por Pix" value={paymentForm.notes} />
                      </label>
                      <div className="mt-5">
                        <h5 className="text-sm font-semibold text-slate-950">Histórico deste cliente</h5>
                        <div className="mt-2 max-h-48 overflow-auto rounded-md border border-slate-100">
                          {(paymentsByTenant[item.id] || []).length ? (paymentsByTenant[item.id] || []).map((payment) => (
                            <div className="grid gap-2 border-b border-slate-100 px-3 py-2 text-sm last:border-b-0 md:grid-cols-5" key={payment.id}>
                              <span><strong>{payment.referenceMonth}</strong></span>
                              <span>{payment.amount}</span>
                              <span>{payment.method}</span>
                              <span>Pago em {payment.paidAt}</span>
                              <span>Vence {payment.nextBillingDate}</span>
                            </div>
                          )) : <p className="px-3 py-4 text-sm text-slate-500">Nenhum pagamento registrado para este cliente.</p>}
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : null,
              ];
            })}
            {!tenants.length ? <tr><td className="px-5 py-8 text-center text-slate-500" colSpan={10}>{loading ? "Carregando clientes..." : "Nenhum cliente encontrado."}</td></tr> : null}
          </tbody>
        </table>
      </div>

      {inactiveTenants.length ? (
        <details className="border-t border-slate-100">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <span>Clientes inativos</span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">{inactiveTenants.length}</span>
          </summary>
          <div className="divide-y divide-slate-100 border-t border-slate-100 bg-slate-50/60">
            {inactiveTenants.map((item) => (
              <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between" key={item.id}>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800">{item.name}</p>
                  <p className="text-xs text-slate-500">{item.contactName || "Responsável não informado"} · {plans[item.planId].label}</p>
                  <p className="text-xs text-slate-500">Dados preservados · status removido</p>
                </div>
                <button aria-label={`Reativar ${item.name}`} className="inline-flex min-h-9 items-center justify-center gap-2 self-start rounded-md border border-cyan-200 bg-white px-3 py-2 text-xs font-semibold text-cyan-800 transition duration-150 hover:-translate-y-0.5 hover:bg-cyan-50 active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 sm:self-auto" onClick={() => changeStatus(item, "ativo")} title="Voltar o cliente para a lista ativa" type="button"><RefreshCw size={14} />Reativar</button>
              </div>
            ))}
          </div>
        </details>
      ) : null}
      {message ? <p className="border-t border-slate-100 px-5 py-3 text-sm font-medium text-slate-700">{message}</p> : null}
    </section>
  );
}
