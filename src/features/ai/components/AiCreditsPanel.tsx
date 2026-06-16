"use client";

import { Bot, CreditCard, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { getAiCreditBalance, type AiCreditBalance } from "../services/aiCreditService";

const packages = [
  { credits: 100, label: "Recarga Inicial", price: "R$ 29,90" },
  { credits: 300, label: "Mais vendido", price: "R$ 69,90" },
  { credits: 1000, label: "Equipe", price: "R$ 189,90" },
];

export function AiCreditsPanel({ tenantId }: { tenantId: string }) {
  const [credits, setCredits] = useState<AiCreditBalance>({ balance: 20, included: 20, status: "Ativo", used: 0 });

  useEffect(() => {
    let alive = true;
    void getAiCreditBalance(tenantId).then((balance) => {
      if (alive) setCredits(balance);
    });
    return () => {
      alive = false;
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
            <h3 className="font-semibold text-slate-950">Add-on IA Financeira</h3>
            <p className="mt-1 text-sm text-cyan-950">Créditos iniciais inclusos. Recargas liberam novas análises, mensagens e resumos.</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-cyan-900 shadow-sm">
          <Sparkles size={16} />
          {credits.status}
        </span>
      </div>

      <div className="grid gap-4 p-5 lg:grid-cols-[280px_1fr]">
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
          <p className="mt-3 text-xs leading-5 text-slate-500">Cada pergunta consome 1 crédito. Quando o saldo acabar, a IA fica bloqueada até contratar uma recarga.</p>
        </div>

        <div>
          <div className="grid gap-3 md:grid-cols-3">
            {packages.map((item) => (
              <article className="rounded-lg border border-slate-200 p-4" key={item.credits}>
                <span className="text-xs font-semibold uppercase text-cyan-700">{item.label}</span>
                <strong className="mt-2 block text-2xl text-slate-950">{item.credits}</strong>
                <p className="text-sm text-slate-500">créditos IA</p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="font-semibold text-slate-950">{item.price}</span>
                  <button className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50" title="Pagamento será conectado na próxima etapa" type="button">
                    <CreditCard size={15} />
                    Solicitar
                  </button>
                </div>
              </article>
            ))}
          </div>
          <p className="mt-3 text-xs text-slate-500">Próxima etapa comercial: conectar recarga ao pagamento e registrar recibo automaticamente.</p>
        </div>
      </div>
    </section>
  );
}
