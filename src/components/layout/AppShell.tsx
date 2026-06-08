"use client";

import {
  BarChart3,
  Building2,
  CreditCard,
  FileText,
  LayoutDashboard,
  Plus,
  Store,
  Truck,
} from "lucide-react";
import type { ReactNode } from "react";
import type { AppUser } from "@/features/auth/types/authTypes";

const navigation = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Lojas", icon: Store },
  { label: "Fornecedores", icon: Truck },
  { label: "Compras", icon: FileText },
  { label: "Contas a pagar", icon: CreditCard },
  { label: "Relatórios", icon: BarChart3 },
];

export function AppShell({
  children,
  onLogout,
  user,
}: {
  children: ReactNode;
  onLogout?: () => void;
  user?: AppUser | null;
}) {
  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-slate-200 bg-white px-5 py-6 lg:block">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-lg bg-slate-950 text-white">
            <Building2 size={22} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Orquestra.cs</p>
            <h1 className="text-2xl font-bold">Orquestra Hub</h1>
          </div>
        </div>
        <nav className="mt-8 space-y-1">
          {navigation.map(({ label, icon: Icon }) => (
            <a
              className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-950"
              href={`#${label.toLowerCase().replaceAll(" ", "-")}`}
              key={label}
            >
              <Icon size={18} />
              {label}
            </a>
          ))}
        </nav>
      </aside>

      <section className="lg:pl-72">
        <header className="border-b border-slate-200 bg-white px-5 py-5 sm:px-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Hub SaaS modular para pequenos negocios</p>
              <h2 className="mt-1 text-2xl font-semibold">Controle financeiro</h2>
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              {user ? (
                <div className="text-sm text-slate-600 md:text-right">
                  <strong className="block text-slate-950">{user.name}</strong>
                  <span>{user.role}</span>
                </div>
              ) : null}
              <button className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 md:w-auto">
                <Plus size={18} />
                Nova compra
              </button>
              {onLogout ? (
                <button className="rounded-md border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100" onClick={onLogout} type="button">
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
