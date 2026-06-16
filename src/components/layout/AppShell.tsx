"use client";

import {
  BarChart3,
  Building2,
  CreditCard,
  CalendarClock,
  FileText,
  LayoutDashboard,
  Plus,
  Settings,
  Store,
  Truck,
  UserRound,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import type { AppUser } from "@/features/auth/types/authTypes";
import type { CompanyMembership } from "@/features/auth/types/authTypes";

const navigation = [
  { description: "Visão geral dos indicadores e próximos vencimentos.", id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { description: "Cadastro e consulta das unidades da empresa.", id: "lojas", label: "Lojas", icon: Store },
  { description: "Cadastro, busca e consulta dos fornecedores.", id: "fornecedores", label: "Fornecedores", icon: Truck },
  { description: "Lançamento de notas e geração de parcelas.", id: "compras", label: "Compras", icon: FileText },
  { description: "Controle de boletos, baixas, filtros e comprovantes.", id: "contas-a-pagar", label: "Contas a pagar", icon: CreditCard },
  { description: "Despesas mensais, recorrência e alertas de vencimento.", id: "despesas-fixas", label: "Despesas fixas", icon: CalendarClock },
  { description: "Resumo financeiro por loja, fornecedor e operação.", id: "relatorios", label: "Relatórios", icon: BarChart3 },
  { description: "Dados e permissões do usuário conectado.", id: "perfil", label: "Perfil", icon: UserRound },
  { description: "Preferências, segurança e integrações do sistema.", id: "configuracoes", label: "Configurações", icon: Settings },
];

export function AppShell({
  children,
  onLogout,
  user,
  companies = [],
  onCompanyChange,
}: {
  children: ReactNode;
  onLogout?: () => void;
  user?: AppUser | null;
  companies?: CompanyMembership[];
  onCompanyChange?: (tenantId: string) => void;
}) {
  const [activeSection, setActiveSection] = useState(navigation[0].id);

  useEffect(() => {
    function updateFromScroll() {
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 24) {
        setActiveSection("configuracoes");
        return;
      }
      const current = navigation.map((item) => document.getElementById(item.id)).filter(Boolean).filter((section) => section!.getBoundingClientRect().top <= window.innerHeight * 0.38).at(-1);
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

    navigation.forEach((item) => {
      const section = document.getElementById(item.id);
      if (section) observer.observe(section);
    });
    window.addEventListener("scroll", updateFromScroll, { passive: true });
    updateFromScroll();

    return () => { observer.disconnect(); window.removeEventListener("scroll", updateFromScroll); };
  }, []);

  return (
    <main className="executive-bg min-h-screen text-slate-950">
      <aside className="executive-sidebar fixed inset-y-0 left-0 hidden w-72 border-r border-white/10 px-5 py-6 text-white lg:block">
        <div className="flex items-center gap-3">
          <div className="premium-ring flex size-12 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-200">
            <Building2 size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">Orquestra.cs</p>
            <h1 className="text-2xl font-bold">Orquestra Hub</h1>
          </div>
        </div>
        <div className="mt-6 rounded-lg border border-white/10 bg-white/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Empresa ativa</p>
          <strong className="mt-2 block truncate text-sm text-white">{user?.companyName || "Gestão empresarial"}</strong>
          <span className="mt-2 inline-flex rounded-md bg-amber-300/10 px-2 py-1 text-xs font-semibold text-amber-200">{user?.role || "Acesso seguro"}</span>
        </div>
        <nav className="mt-8 space-y-1">
          {navigation.map(({ description, id, label, icon: Icon }) => {
            const isActive = activeSection === id;
            return (
              <a
                className={`group relative flex items-center gap-3 rounded-md border px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? "border-amber-300/40 bg-amber-300/10 text-amber-100 shadow-sm shadow-amber-950/20"
                    : "border-transparent text-slate-300 hover:border-white/10 hover:bg-white/5 hover:text-white"
                }`}
                href={`#${id}`}
                key={id}
                title={description}
              >
                <span className={`absolute left-0 top-2 h-6 w-1 rounded-r-full ${isActive ? "bg-amber-300 shadow-[0_0_14px_rgba(252,211,77,.75)]" : "bg-transparent"}`} />
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

      <section className="lg:pl-72">
        <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 px-5 py-5 shadow-sm backdrop-blur-xl sm:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">{user?.companyName || "Plataforma modular de gestão empresarial"}</p>
              <h2 className="mt-1 text-2xl font-semibold">Centro executivo financeiro</h2>
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              {user ? (
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600 md:text-right">
                  <strong className="block text-slate-950">{user.name}</strong>
                  <span>{user.role}</span>
                </div>
              ) : null}
              {companies.length > 1 ? <select aria-label="Empresa ativa" className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm" onChange={(event) => onCompanyChange?.(event.target.value)} value={user?.tenantId}>{companies.map((company) => <option key={company.tenantId} value={company.tenantId}>{company.companyName}</option>)}</select> : null}
              <a
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/15 hover:bg-slate-800 md:w-auto"
                href="#compras"
                title="Ir para o lançamento de uma nova compra e gerar parcelas."
              >
                <Plus size={18} />
                Nova compra
              </a>
              {onLogout ? (
                <button
                  className="rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                  onClick={onLogout}
                  title="Encerrar a sessão atual do sistema."
                  type="button"
                >
                  Sair
                </button>
              ) : null}
            </div>
          </div>
        </header>
        {children}
      </section>
    </main>
  );
}
