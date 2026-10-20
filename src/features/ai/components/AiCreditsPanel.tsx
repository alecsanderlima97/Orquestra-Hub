"use client";

import { Bot, CreditCard, LoaderCircle, Sparkles, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase/config";
import { AI_CREDIT_PACKAGES, type AiCreditPackageId } from "../aiCreditPackages";
import { getPlanRules, type PlanId } from "@/features/plans/planRules";
import { getAiCreditBalance, type AiCreditBalance } from "../services/aiCreditService";

export function AiCreditsPanel({ companyName, planId, tenantId }: { companyName: string; planId?: PlanId; tenantId: string }) {
  const plan = getPlanRules(planId);
  const [credits, setCredits] = useState<AiCreditBalance>({ balance: plan.initialAiCredits, bonus: 0, included: plan.initialAiCredits, status: "Ativo", used: 0 });
  const [pendingPackage, setPendingPackage] = useState<AiCreditPackageId | null>(null);
  const [paymentError, setPaymentError] = useState("");

  useEffect(() => {
    let alive = true;
    function loadCredits() {
      void getAiCreditBalance(tenantId).then((balance) => {
        if (alive) setCredits(balance);
      });
    }
    loadCredits();
    window.addEventListener("orquestra-ai-credits-updated", loadCredits);
    window.addEventListener("focus", loadCredits);
    return () => {
      alive = false;
      window.removeEventListener("orquestra-ai-credits-updated", loadCredits);
      window.removeEventListener("focus", loadCredits);
    };
  }, [tenantId]);

  const total = Math.max(credits.balance + credits.used, credits.included, 1);
  const percent = Math.min(100, Math.round((credits.balance / total) * 100));

  async function openPayment(packageId: AiCreditPackageId) {
    const user = auth?.currentUser;
    if (!user) {
      setPaymentError("Entre no sistema para abrir o pagamento.");
      return;
    }
    setPendingPackage(packageId);
    setPaymentError("");
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/ai/credits/payment-link", { body: JSON.stringify({ packageId, tenantId }), headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, method: "POST" });
      const data = await response.json().catch(() => ({})) as { error?: string; url?: string };
      if (!response.ok || !data.url) throw new Error(data.error || "Não foi possível abrir o pagamento.");
      window.location.assign(data.url);
    } catch (error) {
      setPaymentError(error instanceof Error ? error.message : "Não foi possível abrir o pagamento.");
      setPendingPackage(null);
    }
  }

  return (
    <section className="theme-surface overflow-hidden rounded-lg border border-cyan-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-cyan-100 bg-cyan-50 p-5 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <span className="flex size-12 items-center justify-center rounded-md bg-slate-950 text-cyan-300">
            <Bot size={24} />
          </span>
          <div>
            <h3 className="font-semibold text-slate-950">IA Financeira Orquestra</h3>
            <p className="mt-1 text-sm text-cyan-950">{plan.aiEnabled ? "Créditos mensais para análises, resumos e apoio nas decisões do caixa." : "Disponível a partir do Plano Profissional."}</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-cyan-900 shadow-sm">
          <Sparkles size={16} />
          {plan.label}
        </span>
      </div>

      <div className="grid gap-4 p-5 lg:grid-cols-[300px_1fr]">
        <div className="rounded-lg border border-slate-200 p-4">
          <div className="flex items-end justify-between">
            <div>
              <span className="text-xs font-semibold uppercase text-slate-500">Saldo atual</span>
              <strong className="mt-1 block text-4xl text-slate-950">{credits.balance}</strong>
            </div>
            <div className="text-right text-sm text-slate-500">
              <span className="block">Usados</span>
              <strong className="text-slate-800">{credits.used}</strong>
            </div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
            <span className="block h-full rounded-full bg-cyan-500" style={{ width: `${percent}%` }} />
          </div>
          <p className="mt-3 text-xs leading-5 text-slate-500">
            {plan.aiEnabled ? `Seu plano renova ${plan.monthlyAiCredits} crédito(s) por mês. Cada pergunta consome 1 crédito.` : "Seu plano atual não inclui assistente IA."}
          </p>
          {credits.bonus > 0 ? <p className="mt-2 text-xs font-semibold text-cyan-800">Créditos extras disponíveis: {credits.bonus}</p> : null}
        </div>

        <div>
          {plan.aiEnabled ? (
            <div className="grid gap-3 md:grid-cols-3">
              {Object.entries(AI_CREDIT_PACKAGES).map(([packageId, item]) => (
                <article className="rounded-lg border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-md" key={packageId}>
                  <span className="inline-flex items-center gap-1 rounded-md bg-cyan-50 px-2 py-1 text-xs font-bold uppercase text-cyan-800">
                    <Zap size={13} />{item.label}
                  </span>
                  <strong className="mt-3 block text-3xl text-slate-950">{item.credits}</strong>
                  <p className="text-sm text-slate-500">créditos IA</p>
                  <p className="mt-3 min-h-10 text-xs leading-5 text-slate-500">{item.helper}</p>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="font-bold text-slate-950">{item.price}</span>
                    <button className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60" disabled={pendingPackage === packageId} onClick={() => void openPayment(packageId as AiCreditPackageId)} title="Abrir pagamento no Portal" type="button">
                      {pendingPackage === packageId ? <LoaderCircle className="animate-spin" size={15} /> : <CreditCard size={15} />}
                      {pendingPackage === packageId ? "Abrindo" : "Comprar"}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Faça upgrade para liberar a IA Financeira e receber créditos mensais no plano.</div>
          )}
          {paymentError ? <p className="mt-3 text-xs font-medium text-red-700">{paymentError}</p> : null}
          <p className="mt-3 text-xs text-slate-500">O pagamento abre no Portal, sem criar uma segunda carteira. O crédito entra somente após a confirmação do provedor.</p>
        </div>
      </div>
    </section>
  );
}
