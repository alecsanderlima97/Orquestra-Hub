"use client";

import { Bot, CreditCard, Sparkles, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { getPlanRules, type PlanId } from "@/features/plans/planRules";
import { getAiCreditBalance, type AiCreditBalance } from "../services/aiCreditService";

const salesWhatsapp = (process.env.NEXT_PUBLIC_SALES_WHATSAPP || "5515998478705").replace(/\D/g, "");

const packages = [
  { credits: 100, helper: "Para uso leve e validações rápidas.", label: "Essencial", price: "R$ 29,90" },
  { credits: 300, helper: "Boa margem para rotina financeira semanal.", label: "Mais escolhido", price: "R$ 69,90" },
  { credits: 1000, helper: "Para equipes que usam IA no dia a dia.", label: "Performance", price: "R$ 189,90" },
];

function requestPackage(companyName: string, item: { credits: number; price: string }) {
  const message = [
    "Olá, quero contratar créditos para a IA Financeira do Orquestra Hub.",
    "",
    `Empresa: ${companyName}`,
    `Pacote: ${item.credits} créditos - ${item.price}`,
    "",
    "Pode me enviar as informações para pagamento?",
  ].join("\n");
  window.open(`https://wa.me/${salesWhatsapp}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
}

export function AiCreditsPanel({ companyName, planId, tenantId }: { companyName: string; planId?: PlanId; tenantId: string }) {
  const plan = getPlanRules(planId);
  const [credits, setCredits] = useState<AiCreditBalance>({ balance: plan.initialAiCredits, included: plan.initialAiCredits, status: "Ativo", used: 0 });

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
        </div>

        <div>
          {plan.aiEnabled ? (
            <div className="grid gap-3 md:grid-cols-3">
              {packages.map((item) => (
                <article className="rounded-lg border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-md" key={item.credits}>
                  <span className="inline-flex items-center gap-1 rounded-md bg-cyan-50 px-2 py-1 text-xs font-bold uppercase text-cyan-800">
                    <Zap size={13} />{item.label}
                  </span>
                  <strong className="mt-3 block text-3xl text-slate-950">{item.credits}</strong>
                  <p className="text-sm text-slate-500">créditos IA</p>
                  <p className="mt-3 min-h-10 text-xs leading-5 text-slate-500">{item.helper}</p>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="font-bold text-slate-950">{item.price}</span>
                    <button className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50" onClick={() => requestPackage(companyName, item)} title="Solicitar recarga pelo WhatsApp" type="button">
                      <CreditCard size={15} />
                      WhatsApp
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Faça upgrade para liberar a IA Financeira e receber créditos mensais no plano.</div>
          )}
          <p className="mt-3 text-xs text-slate-500">A solicitação abre no WhatsApp para aprovação manual, evitando consumo sem pagamento confirmado.</p>
        </div>
      </div>
    </section>
  );
}
