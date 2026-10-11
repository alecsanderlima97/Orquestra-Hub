"use client";

import {
  BarChart3,
  CreditCard,
  CalendarClock,
  FileText,
  History,
  LayoutDashboard,
  Plus,
  RefreshCw,
  Settings,
  ShieldCheck,
  Store,
  Truck,
  UserRound,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import type { AppUser } from "@/features/auth/types/authTypes";
import type { CompanyMembership } from "@/features/auth/types/authTypes";
import { OrquestraBrand } from "@/components/branding/OrquestraBrand";
import { PrivacyProvider } from "@/components/ui/PrivacyContext";
import { currentReleaseNotes } from "@/features/updates/releaseNotes";
import { UtilityDock } from "./UtilityDock";

const navigation = [
  { description: "Visão geral dos indicadores e próximos vencimentos.", id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { description: "Cadastro e consulta das unidades da empresa.", id: "lojas", label: "Lojas", icon: Store },
  { description: "Cadastro, busca e consulta dos fornecedores.", id: "fornecedores", label: "Fornecedores", icon: Truck },
  { description: "Lançamento de notas e geração de parcelas.", id: "compras", label: "Compras", icon: FileText },
  { description: "Controle de boletos, baixas, filtros e comprovantes.", id: "contas-a-pagar", label: "Contas a pagar", icon: CreditCard },
  { description: "Despesas mensais, recorrência e alertas de vencimento.", id: "despesas-fixas", label: "Despesas fixas", icon: CalendarClock },
  { description: "Resumo financeiro por loja, fornecedor e operação.", id: "relatorios", label: "Relatórios", icon: BarChart3 },
  { description: "Histórico financeiro e auditoria das principais alterações.", id: "auditoria", label: "Auditoria", icon: History },
  { description: "Dados e permissões do usuário conectado.", id: "perfil", label: "Perfil", icon: UserRound },
  { description: "Preferências, segurança e integrações do sistema.", id: "configuracoes", label: "Configurações", icon: Settings },
];

export function AppShell({
  children,
  onLogout,
  user,
  companies = [],
  onCompanyChange,
  onOpenReleaseNotes,
  showPlatformAdmin = false,
}: {
  children: ReactNode;
  onLogout?: () => void;
  user?: AppUser | null;
  companies?: CompanyMembership[];
  onCompanyChange?: (tenantId: string) => void;
  onOpenReleaseNotes?: () => void;
  showPlatformAdmin?: boolean;
}) {
  const visibleNavigation = useMemo(
    () => showPlatformAdmin
      ? [...navigation, { description: "Central exclusiva da Orquestra.cs para clientes, planos e bloqueios.", id: "admin-orquestra", label: "Admin Orquestra", icon: ShieldCheck }]
      : navigation,
    [showPlatformAdmin],
  );
  const [activeSection, setActiveSection] = useState(visibleNavigation[0].id);

  useEffect(() => {
    function updateFromScroll() {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 24) {
        setActiveSection(visibleNavigation.at(-1)?.id || "configuracoes");
        return;
      }
      const current = visibleNavigation.map((item) => document.getElementById(item.id)).filter(Boolean).filter((section) => section!.getBoundingClientRect().top <= window.innerHeight * 0.38).at(-1);
      if (current?.id) setActiveSection(current.id);
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) setActiveSection(visible.target.id);
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: [0.15, 0.35, 0.6] },
    );

    visibleNavigation.forEach((item) => {
      const section = document.getElementById(item.id);
      if (section) observer.observe(section);
    });
    window.addEventListener("scroll", updateFromScroll, { passive: true });
    updateFromScroll();

    return () => { observer.disconnect(); window.removeEventListener("scroll", updateFromScroll); };
  }, [visibleNavigation]);

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <PrivacyProvider>
      <aside className="app-sidebar fixed inset-y-0 left-0 hidden w-64 overflow-y-auto px-4 py-6 pb-28 lg:block">
        <OrquestraBrand tone="dark" />
        <nav className="mt-8 space-y-1">
          {visibleNavigation.map(({ description, id, label, icon: Icon }) => {
            const isActive = activeSection === id;
            return (
              <a
                className={`motion-button app-sidebar-link group relative flex items-center gap-3 rounded-md border px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "app-sidebar-link-active"
                    : "border-transparent"
                }`}
                href={`#${id}`}
                key={id}
                title={description}
              >
                <span className={`absolute left-0 top-2 h-6 w-1 rounded-r-full ${isActive ? "bg-cyan-200" : "bg-transparent"}`} />
                <Icon size={18} />
                {label}
                <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-3 hidden w-64 -translate-y-1/2 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium leading-5 text-slate-700 shadow-lg group-hover:block">
                  {description}
                </span>
              </a>
            );
          })}
        </nav>
      </aside>

      <section className="lg:pl-64">
        <header className="app-header px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <OrquestraBrand compact tone="dark" />
              <div className="hidden border-l border-white/25 pl-4 sm:block">
                <p className="app-header-muted text-xs font-semibold uppercase tracking-[0.14em]">Ambiente da empresa</p>
                <p className="mt-1 text-sm font-semibold text-white">{user?.companyName || "Plataforma modular de gestão empresarial"}</p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center md:justify-end">
              {user ? (
                <div className="app-header-user text-sm sm:mr-1 sm:text-right">
                  <strong className="block text-white">{user.name}</strong>
                  <span className="app-header-muted">{user.role}</span>
                </div>
              ) : null}
              {companies.length > 1 ? <select aria-label="Empresa ativa" className="h-11 w-full rounded-md border border-white/30 bg-white/95 px-3 text-sm text-slate-800 sm:w-auto sm:max-w-[220px]" onChange={(event) => onCompanyChange?.(event.target.value)} value={user?.tenantId}>{companies.map((company) => <option key={company.tenantId} value={company.tenantId}>{company.companyName}</option>)}</select> : null}
              <a
                className="motion-button inline-flex w-full items-center justify-center gap-2 rounded-md bg-white px-4 py-3 text-sm font-semibold text-cyan-900 shadow-sm hover:bg-cyan-50 sm:w-auto"
                href="#compras"
                title="Ir para o lançamento de uma nova compra e gerar parcelas."
              >
                <Plus size={18} />
                Nova compra
              </a>
              <button
                className="motion-button inline-flex w-full items-center justify-center gap-2 rounded-md border border-white/35 bg-white/10 px-4 py-3 text-sm font-semibold text-white hover:border-white/70 hover:bg-white/20 sm:w-auto"
                onClick={() => window.location.reload()}
                title="Atualizar o sistema e carregar a versão mais recente."
                type="button"
              >
                <RefreshCw size={17} />
                Atualizar
              </button>
              {onLogout ? (
                <button
                  className="motion-button w-full rounded-md border border-white/35 px-4 py-3 text-sm font-semibold text-white hover:border-white/70 hover:bg-white/20 sm:w-auto"
                  onClick={onLogout}
                  title="Encerrar a sessão atual do sistema."
                  type="button"
                >
                  Sair
                </button>
              ) : null}
            </div>
          </div>
          <div className="mt-4 border-t border-slate-100 pt-3 lg:hidden">
            <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500" htmlFor="mobile-section-navigation">Navegação rápida</label>
            <select
              aria-label="Navegação rápida por módulo"
              className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-800"
              id="mobile-section-navigation"
              onChange={(event) => {
                const nextId = event.target.value;
                setActiveSection(nextId);
                document.getElementById(nextId)?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              value={activeSection}
            >
              {visibleNavigation.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
            </select>
          </div>
        </header>
        {children}
        <footer className="app-release-footer mx-4 mb-6 mt-2 border-t border-cyan-100 px-2 pt-4 text-center sm:mx-6 lg:mx-8">
          <button className="motion-button inline-flex max-w-full flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs text-slate-500 hover:text-cyan-800" onClick={onOpenReleaseNotes} title="Ver o que mudou nesta versão" type="button">
            <span className="font-semibold">Orquestra Hub v{currentReleaseNotes.version}</span>
            <span aria-hidden="true">·</span>
            <span>{currentReleaseNotes.releaseLabel}</span>
            <span aria-hidden="true">·</span>
            <span>{currentReleaseNotes.publishedAt}</span>
          </button>
        </footer>
      </section>
      <UtilityDock />
      </PrivacyProvider>
    </main>
  );
}
