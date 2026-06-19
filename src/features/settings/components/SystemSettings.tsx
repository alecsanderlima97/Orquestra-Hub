"use client";

import { Bell, Check, Clock3, Code2, Database, Palette, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { AiCreditsPanel } from "@/features/ai/components/AiCreditsPanel";
import { firebaseReady } from "@/lib/firebase/config";

const themes = [
  { id: "claro", label: "Claro", colors: ["#e8edf3", "#fbfcfe", "#087ea4"] },
  { id: "escuro", label: "Escuro", colors: ["#151b24", "#202734", "#7cc7e8"] },
  { id: "cristal", label: "Azul Cristal", colors: ["#dcecf4", "#f5fbff", "#087fb5"] },
  { id: "salvia", label: "Verde Salvia", colors: ["#e4ebe3", "#f8fbf5", "#607d66"] },
] as const;

type ThemeId = typeof themes[number]["id"];

function applyTheme(theme: ThemeId) {
  document.documentElement.dataset.theme = theme;
  window.localStorage.setItem("orquestra-theme", theme);
}

export function SystemSettings({ companyName, tenantId }: { companyName: string; tenantId: string }) {
  const [theme, setTheme] = useState<ThemeId>(() => {
    if (typeof window === "undefined") return "claro";
    const saved = (window.localStorage.getItem("orquestra-theme") || "claro") as ThemeId;
    window.setTimeout(() => applyTheme(saved), 0);
    return saved;
  });

  const settings = [
    { icon: Clock3, title: "Regiao e horario", value: "Portugues (Brasil) - Brasilia" },
    { icon: Database, title: "Banco de dados", value: firebaseReady ? "Firebase Firestore conectado" : "Firebase nao configurado neste ambiente" },
    { icon: ShieldCheck, title: "Seguranca", value: "Autenticacao e regras por empresa" },
    { icon: Bell, title: "Alertas financeiros", value: "Lembretes de vencimento habilitados" },
  ];

  return (
    <div className="space-y-5">
      <section className="theme-surface rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <Palette className="theme-accent" size={21} />
          <div>
            <h3 className="font-semibold">Tema do sistema</h3>
            <p className="theme-muted text-sm text-slate-600">Escolha a aparencia deste dispositivo.</p>
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

      <AiCreditsPanel companyName={companyName} tenantId={tenantId} />

      <section className="theme-surface rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <span className="theme-accent-soft flex size-11 items-center justify-center rounded-md bg-slate-950 text-cyan-300">
            <Code2 size={21} />
          </span>
          <div>
            <h3 className="font-semibold">Desenvolvido por Orquestra.cs</h3>
            <p className="theme-muted mt-1 text-sm text-slate-600">Obrigado por usar o Orquestra Hub. Plataforma desenvolvida para gestao empresarial personalizada.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
