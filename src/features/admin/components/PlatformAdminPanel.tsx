"use client";

import { CircleDollarSign, Copy, Pause, Pencil, RefreshCw, Save, Trash2, X, TicketPlus } from "lucide-react";
import { useEffect, useState } from "react";
import type { PlanId } from "@/features/plans/planRules";
import { plans } from "@/features/plans/planRules";
import { createCommercialInvite } from "@/features/users/services/inviteService";
import { formatBRL, formatCnpj, formatPhone, parseBRL, toTitleCaseBR } from "@/lib/formatters/br";
import { confirmTenantPayment, listPlatformTenants, listTenantPayments, type PlatformPayment, type PlatformTenant, type SubscriptionStatus, updateTenantSubscription } from "../services/platformAdminService";

const statuses: SubscriptionStatus[] = ["trial", "ativo", "pausado", "vencido", "bloqueado", "cancelado"];
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
  if (["pausado", "bloqueado", "cancelado"].includes(item.subscriptionStatus)) return { label: item.subscriptionStatus === "pausado" ? "Pausado" : "Bloqueio manual", tone: "bg-rose-100 text-rose-800" };
  const days = daysUntilBilling(item.nextBillingDate || "");
  if (days === null) return { label: "Sem vencimento", tone: "bg-slate-100 text-slate-700" };
  const lateBusinessDays = businessDaysLate(item.nextBillingDate || "");
  if (lateBusinessDays > graceDays) return { label: `Bloqueio automatico (${lateBusinessDays} dias uteis em atraso)`, tone: "bg-rose-100 text-rose-800" };
  if (days < 0) return { label: `Em tolerancia: bloqueia em ${graceDays - lateBusinessDays + 1} dia(s) util(eis)`, tone: "bg-amber-100 text-amber-800" };
  if (days === 0) return { label: "Vence hoje", tone: "bg-amber-100 text-amber-800" };
  return { label: `Em dia: vence em ${days} dia(s)`, tone: "bg-emerald-100 text-emerald-800" };
}

export function PlatformAdminPanel() {
  const [commercialForm, setCommercialForm] = useState({
    billingDay: "",
    city: "",
    commercialNotes: "",
    contactEmail: "",
    contactName: "",
    contactPhone: "",
    document: "",
    monthlyFee: plans.medio.price,
    paymentMethod: "PIX",
    startDate: todayInput(),
    state: "",
  });
  const [inviteBillingDate, setInviteBillingDate] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [invitePlan, setInvitePlan] = useState<PlanId>("medio");
  const [inviteStatus, setInviteStatus] = useState<SubscriptionStatus>("trial");
  const [editingTenantId, setEditingTenantId] = useState("");
  const [tenants, setTenants] = useState<PlatformTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [paymentTenantId, setPaymentTenantId] = useState("");
  const [paymentForm, setPaymentForm] = useState({ amount: "", method: "PIX", nextBillingDate: "", notes: "", paidAt: todayInput(), referenceMonth: "" });
  const [paymentsByTenant, setPaymentsByTenant] = useState<Record<string, PlatformPayment[]>>({});

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
      const invite = await createCommercialInvite(invitePlan, inviteStatus, inviteBillingDate, commercialForm);
      setInviteCode(invite.code);
      setMessage("Convite comercial gerado. Envie o código para a cliente criar a empresa.");
    } catch {
      setMessage("Não foi possível gerar o convite comercial.");
    }
  }

  async function save(item: PlatformTenant) {
    setMessage("");
    try {
      await updateTenantSubscription(item.id, {
        billingDay: item.billingDay,
        city: item.city,
        commercialNotes: item.commercialNotes,
        contactEmail: item.contactEmail,
        contactName: item.contactName,
        contactPhone: item.contactPhone,
        document: item.document,
        monthlyFee: item.monthlyFee,
        nextBillingDate: item.nextBillingDate,
        paymentMethod: item.paymentMethod,
        planId: item.planId,
        startDate: item.startDate,
        state: item.state,
        subscriptionStatus: item.subscriptionStatus,
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
    const action = subscriptionStatus === "pausado" ? "pausar" : "cancelar";
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
        </div>
        <button className="inline-flex h-10 items-center gap-2 rounded-md border border-amber-300 bg-white px-4 text-sm font-semibold text-amber-900" disabled={loading} onClick={load} type="button">
          <RefreshCw size={16} />Atualizar
        </button>
      </header>

      <div className="border-b border-slate-100 p-5">
        <h4 className="font-semibold">Novo convite comercial</h4>
        <p className="mt-1 text-sm text-slate-600">Use este convite para a cliente criar a própria empresa com o plano liberado por você.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
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
          <input className="h-10 rounded-md border border-slate-300 px-3 text-sm" onChange={(event) => setCommercialForm((form) => ({ ...form, document: formatCnpj(event.target.value) }))} placeholder="CNPJ/CPF" value={commercialForm.document} />
          <input className="h-10 rounded-md border border-slate-300 px-3 text-sm" onBlur={() => setCommercialForm((form) => ({ ...form, city: toTitleCaseBR(form.city) }))} onChange={(event) => setCommercialForm((form) => ({ ...form, city: toTitleCaseBR(event.target.value) }))} placeholder="Cidade" value={commercialForm.city} />
          <input className="h-10 rounded-md border border-slate-300 px-3 text-sm uppercase" maxLength={2} onChange={(event) => setCommercialForm((form) => ({ ...form, state: event.target.value.toUpperCase() }))} placeholder="UF" value={commercialForm.state} />
          <input className="h-10 rounded-md border border-slate-300 px-3 text-sm" onBlur={() => setCommercialForm((form) => ({ ...form, monthlyFee: formatBRL(form.monthlyFee) }))} onChange={(event) => setCommercialForm((form) => ({ ...form, monthlyFee: event.target.value }))} placeholder="Mensalidade" value={commercialForm.monthlyFee} />
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
              const isEditing = editingTenantId === item.id;
              const online = isOnline(item.lastSeenAt);
              return [
              <tr key={item.id}>
                <td className="px-5 py-3">
                  <strong>{item.name}</strong>
                  <p className="text-xs text-slate-500">{item.id}</p>
                  <p className="mt-1 text-xs text-slate-600">{item.contactName || "Responsável não informado"}</p>
                  <p className="text-xs text-slate-500">{item.contactPhone || item.contactEmail || "Contato não informado"}</p>
                </td>
                <td className="px-5 py-3">
                  <select className="h-10 rounded-md border border-slate-300 bg-white px-3 disabled:bg-slate-100 disabled:text-slate-500" disabled={!isEditing} onChange={(event) => updateTenantLocal(item.id, { planId: event.target.value as PlanId })} value={item.planId}>
                    {Object.values(plans).map((plan) => <option key={plan.id} value={plan.id}>{plan.label}</option>)}
                  </select>
                </td>
                <td className="px-5 py-3">
                  <select className="h-10 rounded-md border border-slate-300 bg-white px-3 disabled:bg-slate-100 disabled:text-slate-500" disabled={!isEditing} onChange={(event) => updateTenantLocal(item.id, { subscriptionStatus: event.target.value as SubscriptionStatus })} value={item.subscriptionStatus}>
                    {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </td>
                <td className="px-5 py-3">
                  <input className="h-10 rounded-md border border-slate-300 px-3 disabled:bg-slate-100 disabled:text-slate-500" disabled={!isEditing} onChange={(event) => updateTenantLocal(item.id, { nextBillingDate: event.target.value })} type="date" value={item.nextBillingDate || ""} />
                </td>
                <td className="px-5 py-3">{item.startDate ? formatInputDateBR(item.startDate) : subscriptionStartFromNextBilling(item.nextBillingDate || "")}</td>
                <td className="px-5 py-3">
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${calculatedStatus.tone}`}>{calculatedStatus.label}</span>
                </td>
                <td className="px-5 py-3">{formatDateTime(item.lastAccessAt)}</td>
                <td className="px-5 py-3">
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${online ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"}`}>{online ? "Online agora" : "Offline"}</span>
                </td>
                <td className="px-5 py-3">{item.aiBalance}/{item.aiIncluded}</td>
                <td className="px-5 py-3">
                  <div className="flex flex-wrap gap-2">
                    {isEditing ? (
                      <>
                        <button className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-950 px-3 text-xs font-semibold text-white" onClick={() => save(item)} type="button"><Save size={15} />Salvar</button>
                        <button className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700" onClick={() => { setEditingTenantId(""); void load(); }} type="button"><X size={15} />Cancelar</button>
                      </>
                    ) : (
                      <button className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-amber-50 hover:text-amber-800" onClick={() => setEditingTenantId(item.id)} type="button"><Pencil size={15} />Editar</button>
                    )}
                    <button className="inline-flex h-10 items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-800" onClick={() => openPayment(item)} type="button"><CircleDollarSign size={15} />Confirmar pg.</button>
                    <button className="inline-flex h-10 items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 text-xs font-semibold text-amber-800" onClick={() => changeStatus(item, "pausado")} type="button"><Pause size={15} />Pausar</button>
                    <button className="inline-flex h-10 items-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 text-xs font-semibold text-rose-700" onClick={() => changeStatus(item, "cancelado")} type="button"><Trash2 size={15} />Excluir</button>
                  </div>
                </td>
              </tr>,
              isEditing ? (
                <tr key={`${item.id}-commercial`}>
                  <td className="bg-slate-50 px-5 py-4" colSpan={10}>
                    <div className="rounded-lg border border-slate-200 bg-white p-4">
                      <h4 className="font-semibold text-slate-950">Dados comerciais do cliente</h4>
                      <div className="mt-4 grid gap-3 md:grid-cols-4">
                        <input className="h-10 rounded-md border border-slate-300 px-3 text-sm" onBlur={() => updateTenantLocal(item.id, { contactName: toTitleCaseBR(item.contactName || "") })} onChange={(event) => updateTenantLocal(item.id, { contactName: toTitleCaseBR(event.target.value) })} placeholder="Responsável" value={item.contactName || ""} />
                        <input className="h-10 rounded-md border border-slate-300 px-3 text-sm" onChange={(event) => updateTenantLocal(item.id, { contactPhone: formatPhone(event.target.value) })} placeholder="WhatsApp" value={item.contactPhone || ""} />
                        <input className="h-10 rounded-md border border-slate-300 px-3 text-sm" onChange={(event) => updateTenantLocal(item.id, { contactEmail: event.target.value.toLowerCase() })} placeholder="E-mail comercial" type="email" value={item.contactEmail || ""} />
                        <input className="h-10 rounded-md border border-slate-300 px-3 text-sm" onChange={(event) => updateTenantLocal(item.id, { document: formatCnpj(event.target.value) })} placeholder="CNPJ/CPF" value={item.document || ""} />
                        <input className="h-10 rounded-md border border-slate-300 px-3 text-sm" onBlur={() => updateTenantLocal(item.id, { city: toTitleCaseBR(item.city || "") })} onChange={(event) => updateTenantLocal(item.id, { city: toTitleCaseBR(event.target.value) })} placeholder="Cidade" value={item.city || ""} />
                        <input className="h-10 rounded-md border border-slate-300 px-3 text-sm uppercase" maxLength={2} onChange={(event) => updateTenantLocal(item.id, { state: event.target.value.toUpperCase() })} placeholder="UF" value={item.state || ""} />
                        <input className="h-10 rounded-md border border-slate-300 px-3 text-sm" onBlur={() => updateTenantLocal(item.id, { monthlyFee: formatBRL(item.monthlyFee || plans[item.planId].price) })} onChange={(event) => updateTenantLocal(item.id, { monthlyFee: event.target.value })} placeholder="Mensalidade" value={item.monthlyFee || ""} />
                        <input className="h-10 rounded-md border border-slate-300 px-3 text-sm" maxLength={2} onChange={(event) => updateTenantLocal(item.id, { billingDay: event.target.value.replace(/\D/g, "").slice(0, 2) })} placeholder="Dia venc." value={item.billingDay || ""} />
                        <select className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm" onChange={(event) => updateTenantLocal(item.id, { paymentMethod: event.target.value })} value={item.paymentMethod || "PIX"}>
                          <option>PIX</option>
                          <option>Transferência</option>
                          <option>Dinheiro</option>
                          <option>Outro</option>
                        </select>
                        <input className="h-10 rounded-md border border-slate-300 px-3 text-sm" onChange={(event) => updateTenantLocal(item.id, { startDate: event.target.value })} title="Data de início do cliente" type="date" value={item.startDate || ""} />
                        <input className="h-10 rounded-md border border-slate-300 px-3 text-sm md:col-span-2" onChange={(event) => updateTenantLocal(item.id, { commercialNotes: event.target.value })} placeholder="Observações internas" value={item.commercialNotes || ""} />
                      </div>
                    </div>
                  </td>
                </tr>
              ) : null,
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
      {message ? <p className="border-t border-slate-100 px-5 py-3 text-sm font-medium text-slate-700">{message}</p> : null}
    </section>
  );
}
