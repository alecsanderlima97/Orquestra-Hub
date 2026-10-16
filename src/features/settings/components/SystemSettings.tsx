"use client";

import { Bell, Check, ChevronDown, ChevronUp, Clock3, Code2, CreditCard, Database, MessageCircle, Palette, ReceiptText, ShieldCheck, Sparkles } from "lucide-react";
import { useState } from "react";
import { AiCreditsPanel } from "@/features/ai/components/AiCreditsPanel";
import { getPlanRules, plans, type PlanId } from "@/features/plans/planRules";
import { firebaseReady } from "@/lib/firebase/config";

const themes = [
  { id: "claro", label: "Claro", colors: ["#f1f5f9", "#ffffff", "#0891b2"] },
  { id: "escuro", label: "Escuro", colors: ["#151b24", "#202734", "#7cc7e8"] },
  { id: "cristal", label: "Azul Cristal", colors: ["#dcecf4", "#f5fbff", "#087fb5"] },
  { id: "salvia", label: "Verde Sálvia", colors: ["#e4ebe3", "#f8fbf5", "#607d66"] },
] as const;

type ThemeId = typeof themes[number]["id"];

const supportWhatsapp = (process.env.NEXT_PUBLIC_SALES_WHATSAPP || "5515998478705").replace(/\D/g, "");

function applyTheme(theme: ThemeId) {
  document.documentElement.dataset.theme = theme;
  window.localStorage.setItem("orquestra-theme", theme);
}

export function SystemSettings({ canManageCompanySettings, companyName, onReceiptRequiredChange, planId, receiptRequiredOnPayment, tenantId }: { canManageCompanySettings: boolean; companyName: string; onReceiptRequiredChange: (required: boolean) => Promise<void>; planId?: PlanId; receiptRequiredOnPayment: boolean; tenantId: string }) {
  const [savingReceiptSetting, setSavingReceiptSetting] = useState(false);
  const [showOtherPlans, setShowOtherPlans] = useState(false);
  const [theme, setTheme] = useState<ThemeId>(() => {
    if (typeof window === "undefined") return "claro";
    const saved = (window.localStorage.getItem("orquestra-theme") || "claro") as ThemeId;
    window.setTimeout(() => applyTheme(saved), 0);
    return saved;
  });

  const activePlan = getPlanRules(planId);
  const settings = [
    { icon: Clock3, title: "Região e horário", value: "Português (Brasil) - Brasília" },
    { icon: Database, title: "Banco de dados", value: firebaseReady ? "Firebase Firestore conectado" : "Firebase não configurado neste ambiente" },
    { icon: ShieldCheck, title: "Segurança", value: "Autenticação e regras por empresa" },
    { icon: Bell, title: "Alertas financeiros", value: "Lembretes de vencimento habilitados" },
  ];

  return (
    <div className="space-y-5">
      <section className="theme-surface rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <Palette className="theme-accent" size={21} />
          <div>
            <h3 className="font-semibold">Tema do sistema</h3>
            <p className="theme-muted text-sm text-slate-600">Escolha a aparência deste dispositivo.</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {themes.map((item) => (
            <button
              aria-pressed={theme === item.id}
              className={`relative rounded-md border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md ${theme === item.id ? "border-amber-400 ring-2 ring-amber-100" : "border-slate-200"}`}
              key={item.id}
              onClick={() => {
                setTheme(item.id);
                applyTheme(item.id);
              }}
              type="button"
            >
              <span className="flex gap-2">
                {item.colors.map((color) => (
                  <span className="size-7 rounded-md border border-black/10" key={color} style={{ backgroundColor: color }} />
                ))}
              </span>
              <strong className="mt-3 block text-sm">{item.label}</strong>
              {theme === item.id ? <Check className="absolute right-3 top-3 text-amber-600" size={17} /> : null}
            </button>
          ))}
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        {settings.map(({ icon: Icon, title, value }) => (
          <article className="theme-surface flex gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm" key={title}>
            <div className="theme-accent-soft flex size-11 items-center justify-center rounded-md bg-cyan-50 text-cyan-700">
              <Icon size={21} />
            </div>
            <div>
              <h3 className="font-semibold">{title}</h3>
              <p className="theme-muted mt-1 text-sm text-slate-600">{value}</p>
            </div>
          </article>
        ))}
      </div>

      <section className="theme-surface flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="theme-accent-soft flex size-11 shrink-0 items-center justify-center rounded-md bg-cyan-50 text-cyan-700"><ReceiptText size={21} /></span>
          <div>
            <h3 className="font-semibold">Baixa financeira</h3>
            <p className="theme-muted mt-1 text-sm text-slate-600">Defina se o comprovante será obrigatório antes de registrar um pagamento.</p>
            <p className="mt-2 text-sm font-semibold text-slate-800">Comprovante: {receiptRequiredOnPayment ? "obrigatório" : "opcional"}</p>
          </div>
        </div>
        <label className="inline-flex items-center gap-3 text-sm font-medium text-slate-700">
          <input
            checked={receiptRequiredOnPayment}
            className="size-5 accent-cyan-700"
            disabled={!canManageCompanySettings || savingReceiptSetting}
            onChange={async (event) => {
              setSavingReceiptSetting(true);
              try {
                await onReceiptRequiredChange(event.target.checked);
              } catch (error) {
                window.alert(error instanceof Error ? error.message : "Não foi possível salvar esta configuração.");
              } finally {
                setSavingReceiptSetting(false);
              }
            }}
            type="checkbox"
          />
          Exigir comprovante
        </label>
      </section>

      <section className="theme-surface overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <header className="border-b border-slate-200 bg-slate-950 px-5 py-5 text-white">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-md bg-cyan-400 text-slate-950">
              <Sparkles size={21} />
            </span>
            <div>
              <h3 className="font-semibold">Planos Orquestra Hub</h3>
              <p className="mt-1 text-sm text-slate-300">Plano atual: {activePlan.label} - {activePlan.price}/mês.</p>
            </div>
            </div>
            <button aria-expanded={showOtherPlans} className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-cyan-300/50 px-3 text-sm font-semibold text-cyan-100 transition hover:bg-white/10" onClick={() => setShowOtherPlans((open) => !open)} type="button">
              {showOtherPlans ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              {showOtherPlans ? "Ocultar outros planos" : "Ver outros planos"}
            </button>
          </div>
        </header>
        <div className={`grid gap-4 p-5 ${showOtherPlans ? "lg:grid-cols-3" : "max-w-xl"}`}>
          {(showOtherPlans ? Object.values(plans) : [activePlan]).map((item) => (
            <article className={`relative flex flex-col rounded-lg border p-5 transition duration-200 hover:-translate-y-0.5 hover:border-cyan-300 hover:shadow-[0_0_28px_rgba(34,211,238,0.22)] ${item.id === activePlan.id ? "border-amber-400 bg-amber-50 shadow-md hover:shadow-[0_0_30px_rgba(251,191,36,0.28)]" : "border-slate-200 bg-white"}`} key={item.id}>
              {item.id === activePlan.id ? <span className="absolute right-4 top-4 rounded-md bg-amber-400 px-2 py-1 text-xs font-bold text-slate-950">ATUAL</span> : null}
              <strong className="block pr-16 text-lg text-slate-950">{item.label}</strong>
              <span className="mt-2 block text-2xl font-black text-slate-950">{item.price}</span>
              <div className="mt-4 grid gap-3 text-sm text-slate-700">
                <p><strong>Até {item.storeLimit}</strong> loja(s)/unidade(s)</p>
                <p><strong>Até {item.userLimit}</strong> usuário(s)</p>
                <p>IA Financeira: <strong>{item.aiEnabled ? `${item.monthlyAiCredits} créditos/mês` : "não incluída"}</strong></p>
                <p>WhatsApp assistido: <strong>{item.whatsappEnabled ? "incluído" : "não incluído"}</strong></p>
              </div>
              {item.id === activePlan.id ? <button aria-label="Pagar mensalidade pelo Portal Orquestra.cs" className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-cyan-700 px-4 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-cyan-800 hover:shadow-[0_0_20px_rgba(14,116,144,0.28)] active:translate-y-0" onClick={() => window.alert("O pagamento pelo Portal Orquestra.cs será conectado em breve.")} type="button"><CreditCard size={17} />Pagar mensalidade</button> : null}
            </article>
          ))}
        </div>
      </section>

      <AiCreditsPanel companyName={companyName} planId={planId} tenantId={tenantId} />

      <section className="theme-surface rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
          <span className="theme-accent-soft flex size-11 items-center justify-center rounded-md bg-slate-950 text-cyan-300">
            <Code2 size={21} />
          </span>
          <div>
            <h3 className="font-semibold">Desenvolvido por Orquestra.cs</h3>
            <p className="theme-muted mt-1 text-sm text-slate-600">Obrigado por usar o Orquestra Hub. Plataforma desenvolvida para gestão empresarial personalizada.</p>
          </div>
          </div>
          <a
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-cyan-300 bg-cyan-50 px-4 text-sm font-semibold text-cyan-900 transition hover:-translate-y-0.5 hover:bg-cyan-100 hover:shadow-[0_0_22px_rgba(34,211,238,0.25)]"
            href={`https://wa.me/${supportWhatsapp}?text=${encodeURIComponent("Olá, preciso de suporte no sistema.")}`}
            target="_blank"
            title="Falar com o suporte pelo WhatsApp"
          >
            <MessageCircle size={17} />
            Suporte
          </a>
        </div>
      </section>
    </div>
  );
}
