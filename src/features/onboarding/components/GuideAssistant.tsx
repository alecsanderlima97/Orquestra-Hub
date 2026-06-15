"use client";

import { Bot, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useState } from "react";

const steps = [
  { target: "lojas", title: "Cadastre sua primeira unidade", text: "Use o botão Cadastrar nova unidade para informar endereço, responsável e dados da loja." },
  { target: "fornecedores", title: "Adicione seus fornecedores", text: "Registre contatos, PIX, banco e condições de pagamento para agilizar as contas." },
  { target: "compras", title: "Lance compras e notas", text: "Informe produtos, nota fiscal, boletos e parcelas. O sistema organizará os vencimentos." },
  { target: "contas-a-pagar", title: "Acompanhe os pagamentos", text: "Dê baixa, anexe comprovantes e envie avisos pelo WhatsApp." },
  { target: "configuracoes", title: "Convide sua equipe", text: "Em Configurações, escolha Proprietário, Financeiro ou Consulta para cada convite." },
];

export function GuideAssistant({ userId }: { userId: string }) {
  const storageKey = `orquestra-guide-dismissed-${userId}`;
  const [visible, setVisible] = useState(() => typeof window === "undefined" || window.localStorage.getItem(storageKey) !== "1");
  const [step, setStep] = useState(0);
  if (!visible) return null;
  const current = steps[step];
  function go(index: number) { setStep(index); window.setTimeout(() => document.getElementById(steps[index].target)?.scrollIntoView({ behavior: "smooth", block: "start" }), 0); }
  function dismiss() { window.localStorage.setItem(storageKey, "1"); setVisible(false); }
  return <aside className="fixed bottom-5 right-5 z-[100] w-[calc(100%-2.5rem)] max-w-sm overflow-hidden rounded-lg border border-cyan-200 bg-white shadow-2xl"><header className="flex items-center justify-between bg-slate-950 px-4 py-3 text-white"><div className="flex items-center gap-3"><span className="flex size-9 items-center justify-center rounded-md bg-cyan-400 text-slate-950"><Bot size={22} /></span><div><strong className="block text-sm">Assistente Orquestra</strong><span className="text-xs text-slate-300">Passo {step + 1} de {steps.length}</span></div></div><button onClick={dismiss} title="Ignorar ajuda" type="button"><X size={19} /></button></header><div className="p-4"><h3 className="font-semibold text-slate-950">{current.title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{current.text}</p><div className="mt-4 flex items-center justify-between gap-2"><button className="text-xs font-semibold text-slate-500 hover:text-rose-700" onClick={dismiss} type="button">Ignorar ajuda</button><div className="flex gap-2"><button className="rounded-md border border-slate-200 p-2 disabled:opacity-40" disabled={step === 0} onClick={() => go(step - 1)} title="Passo anterior" type="button"><ChevronLeft size={17} /></button>{step < steps.length - 1 ? <button className="inline-flex items-center gap-1 rounded-md bg-cyan-700 px-3 py-2 text-xs font-semibold text-white" onClick={() => go(step + 1)} type="button">Próximo <ChevronRight size={16} /></button> : <button className="rounded-md bg-emerald-700 px-3 py-2 text-xs font-semibold text-white" onClick={dismiss} type="button">Concluir</button>}</div></div></div></aside>;
}
