"use client";

import { Bot, Cpu, Loader2, Send, Sparkles, X } from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { auth } from "@/lib/firebase/config";
import { buildAssistantSnapshot } from "../utils/assistantContext";
import type { AssistantContext, AssistantCredits, AssistantUsage } from "../types/assistantTypes";

type Message = { role: "assistant" | "user"; text: string };

const quickPrompts = [
  "Faça um resumo financeiro do mês.",
  "Quais contas precisam de atenção primeiro?",
  "Analise meus fornecedores e formas de pagamento.",
  "Crie uma mensagem de WhatsApp para alertar vencimentos.",
];

function formatUsage(usage?: AssistantUsage) {
  if (!usage) return "US$ 0.0000";
  return `US$ ${usage.estimatedCostUsd.toFixed(4)}`;
}

export function FinancialAssistant({ context, tenantId }: { context: AssistantContext; tenantId: string }) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [credits, setCredits] = useState<AssistantCredits>();
  const [usage, setUsage] = useState<AssistantUsage>();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      text: "Olá! Sou a IA financeira do Orquestra Hub. Posso analisar contas, notas, fornecedores, despesas e ajudar nas decisões do caixa.",
    },
  ]);
  const snapshot = useMemo(() => buildAssistantSnapshot(context), [context]);

  async function askAssistant(text: string) {
    const prompt = text.trim();
    if (!prompt || loading) return;
    setQuestion("");
    setLoading(true);
    setMessages((items) => [...items, { role: "user", text: prompt }]);
    try {
      const token = await auth?.currentUser?.getIdToken();
      if (!token) throw new Error("Sessão expirada. Entre novamente para usar a IA.");
      const response = await fetch("/api/ai/assistant", {
        body: JSON.stringify({ context: snapshot, question: prompt, tenantId }),
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        method: "POST",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Não foi possível consultar a IA.");
      setCredits(data.credits);
      setUsage(data.usage);
      setMessages((items) => [...items, { role: "assistant", text: data.answer }]);
    } catch (error) {
      setMessages((items) => [
        ...items,
        { role: "assistant", text: error instanceof Error ? error.message : "Não foi possível consultar a IA agora." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void askAssistant(question);
  }

  return (
    <>
      <button
        className="fixed bottom-24 right-5 z-[110] flex size-14 items-center justify-center rounded-full border border-cyan-200 bg-slate-950 text-cyan-200 shadow-2xl shadow-cyan-500/25 transition hover:scale-105 hover:bg-cyan-950 hover:text-white"
        onClick={() => setOpen(true)}
        title="Abrir assistente IA financeiro"
        type="button"
      >
        <span className="relative flex size-9 items-center justify-center rounded-full bg-cyan-400/15">
          <Cpu size={24} />
          <Sparkles className="absolute -right-1 -top-1 text-cyan-300" size={13} />
        </span>
      </button>
      {open ? (
        <aside className="fixed bottom-5 right-5 z-[120] flex max-h-[calc(100vh-2.5rem)] w-[calc(100%-2.5rem)] max-w-md flex-col overflow-hidden rounded-lg border border-cyan-200 bg-white shadow-2xl">
          <header className="flex items-center justify-between bg-slate-950 px-4 py-3 text-white">
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center rounded-md bg-cyan-400 text-slate-950">
                <Bot size={22} />
              </span>
              <div>
                <strong className="block text-sm">IA Financeira</strong>
                <span className="text-xs text-slate-300">Orquestra Hub conectado</span>
              </div>
            </div>
            <button className="rounded-md p-2 hover:bg-white/10" onClick={() => setOpen(false)} title="Fechar IA" type="button">
              <X size={18} />
            </button>
          </header>

          <div className="grid grid-cols-4 gap-2 border-b border-slate-200 bg-slate-50 p-3 text-xs">
            <div className="rounded-md bg-white p-2">
              <strong className="block text-slate-950">{snapshot.totals.openAccounts}</strong>
              <span className="text-slate-500">Abertas</span>
            </div>
            <div className="rounded-md bg-white p-2">
              <strong className="block text-rose-700">{snapshot.totals.overdueAccounts}</strong>
              <span className="text-slate-500">Atrasadas</span>
            </div>
            <div className="rounded-md bg-white p-2">
              <strong className="block text-slate-950">{formatUsage(usage)}</strong>
              <span className="text-slate-500">Uso estimado</span>
            </div>
            <div className="rounded-md bg-white p-2">
              <strong className="block text-cyan-800">{credits?.balance ?? 5}</strong>
              <span className="text-slate-500">Créditos IA</span>
            </div>
          </div>

          <div className="border-b border-cyan-100 bg-cyan-50 px-4 py-3 text-xs leading-5 text-cyan-950">
            A empresa ganha 5 créditos iniciais. Cada pergunta consome 1 crédito. Ao acabar, contrate uma recarga para continuar usando a IA.
          </div>

          <div className="flex flex-wrap gap-2 border-b border-slate-200 p-3">
            {quickPrompts.map((prompt) => (
              <button
                className="rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-xs font-semibold text-cyan-900 hover:bg-cyan-100"
                disabled={loading}
                key={prompt}
                onClick={() => askAssistant(prompt)}
                type="button"
              >
                {prompt}
              </button>
            ))}
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
            {messages.map((message, index) => (
              <div
                className={`rounded-lg px-3 py-2 text-sm leading-6 shadow-sm ${message.role === "user" ? "ml-8 bg-slate-950 text-white" : "mr-8 border border-slate-200 bg-white text-slate-700"}`}
                key={`${message.role}-${index}`}
              >
                {message.text}
              </div>
            ))}
            {loading ? (
              <div className="mr-8 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500">
                <Loader2 className="animate-spin" size={16} />
                Analisando dados...
              </div>
            ) : null}
          </div>

          <form className="flex gap-2 border-t border-slate-200 bg-white p-3" onSubmit={submit}>
            <input
              className="h-11 flex-1 rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Pergunte sobre o financeiro"
              value={question}
            />
            <button
              className="flex size-11 items-center justify-center rounded-md bg-slate-950 text-white hover:bg-slate-800 disabled:opacity-50"
              disabled={loading || !question.trim()}
              title="Enviar pergunta"
              type="submit"
            >
              <Send size={18} />
            </button>
          </form>
        </aside>
      ) : null}
    </>
  );
}
