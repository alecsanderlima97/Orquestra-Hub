"use client";

import { Bell, Check, Clock3, Database, Palette, ShieldCheck } from "lucide-react";
import { useState } from "react";

const themes = [
  { id: "claro", label: "Claro", colors: ["#f1f5f9", "#ffffff", "#0891b2"] },
  { id: "escuro", label: "Escuro", colors: ["#0b1220", "#111827", "#38bdf8"] },
  { id: "cristal", label: "Azul Cristal", colors: ["#eaf7ff", "#f8fdff", "#0284c7"] },
  { id: "salvia", label: "Verde Sálvia", colors: ["#edf2ec", "#fbfdf9", "#66856b"] },
] as const;

type ThemeId = typeof themes[number]["id"];

function applyTheme(theme: ThemeId) {
  document.documentElement.dataset.theme = theme;
  window.localStorage.setItem("orquestra-theme", theme);
}

export function SystemSettings() {
  const [theme, setTheme] = useState<ThemeId>(() => {
    if (typeof window === "undefined") return "claro";
    const saved = (window.localStorage.getItem("orquestra-theme") || "claro") as ThemeId;
    window.setTimeout(() => applyTheme(saved), 0);
    return saved;
  });
  const settings = [
    { icon: Clock3, title: "Região e horário", value: "Português (Brasil) · Brasília" },
    { icon: Database, title: "Banco de dados", value: "Firebase Firestore conectado" },
    { icon: ShieldCheck, title: "Segurança", value: "Autenticação e regras por empresa" },
    { icon: Bell, title: "Alertas financeiros", value: "Lembretes de vencimento habilitados" },
  ];
  return <div className="space-y-5"><div className="grid gap-4 md:grid-cols-2">{settings.map(({ icon: Icon, title, value }) => <article className="theme-surface flex gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm" key={title}><div className="theme-accent-soft flex size-11 items-center justify-center rounded-md bg-cyan-50 text-cyan-700"><Icon size={21} /></div><div><h3 className="font-semibold">{title}</h3><p className="theme-muted mt-1 text-sm text-slate-600">{value}</p></div></article>)}</div><section className="theme-surface rounded-lg border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-3"><Palette className="theme-accent" size={21} /><div><h3 className="font-semibold">Tema do sistema</h3><p className="theme-muted text-sm text-slate-600">Escolha a aparência deste dispositivo.</p></div></div><div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{themes.map((item) => <button aria-pressed={theme === item.id} className={`relative rounded-md border p-3 text-left transition hover:-translate-y-0.5 hover:shadow-md ${theme === item.id ? "border-amber-400 ring-2 ring-amber-100" : "border-slate-200"}`} key={item.id} onClick={() => { setTheme(item.id); applyTheme(item.id); }} type="button"><span className="flex gap-2">{item.colors.map((color) => <span className="size-7 rounded-md border border-black/10" key={color} style={{ backgroundColor: color }} />)}</span><strong className="mt-3 block text-sm">{item.label}</strong>{theme === item.id ? <Check className="absolute right-3 top-3 text-amber-600" size={17} /> : null}</button>)}</div></section></div>;
}
