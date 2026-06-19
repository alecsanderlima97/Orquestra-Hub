"use client";

import { Building2, CheckCircle2, LogOut, Sparkles } from "lucide-react";
import { useState } from "react";
import { TextField } from "@/components/ui/TextField";
import type { AppUser } from "@/features/auth/types/authTypes";

export function FirstAccessOnboarding({ onComplete, onLogout }: { onComplete: (companyName: string, userName: string, inviteCode: string) => Promise<void>; onLogout: () => Promise<void>; user: AppUser }) {
  const [companyName, setCompanyName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function finish() {
    const finalCompanyName = companyName.trim();
    const finalUserName = userName.trim();
    if (!finalUserName || !finalCompanyName || !inviteCode.trim()) {
      setError("Informe seu nome, nome da empresa e codigo de convite para iniciar o uso.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onComplete(finalCompanyName, finalUserName, inviteCode);
    } catch {
      setError("Nao foi possivel preparar seu ambiente. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-5">
      <div className="w-full max-w-3xl overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
        <header className="bg-slate-950 px-7 py-8 text-white">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-cyan-300">
              <Sparkles size={22} />
              <span className="text-sm font-semibold uppercase">Primeiro acesso obrigatorio</span>
            </div>
            <button className="inline-flex items-center gap-2 rounded-md border border-white/20 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10" onClick={onLogout} type="button">
              <LogOut size={15} />Sair
            </button>
          </div>
          <h1 className="mt-3 text-3xl font-bold">Bem-vindo ao Orquestra Hub.</h1>
          <p className="mt-2 text-slate-300">Antes de usar o sistema, cadastre seu nome e a empresa onde seus lancamentos serao salvos.</p>
        </header>
        <div className="grid gap-7 p-7 md:grid-cols-2">
          <section>
            <h2 className="font-semibold">Cadastre sua primeira empresa</h2>
            <p className="mt-1 text-sm text-slate-600">Esse cadastro cria seu ambiente online exclusivo. Depois voce podera convidar outros usuarios.</p>
            <div className="mt-5 space-y-4">
              <TextField label="Seu nome" onChange={(event) => setUserName(event.target.value)} placeholder="Ex.: Alecsander Lima" value={userName} />
              <TextField label="Nome da empresa" onChange={(event) => setCompanyName(event.target.value)} placeholder="Ex.: Orquestra Hub" value={companyName} />
              <TextField label="Codigo de convite" onChange={(event) => setInviteCode(event.target.value.toUpperCase())} placeholder="Codigo enviado pela Orquestra.cs" value={inviteCode} />
            </div>
            {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
            <button className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-cyan-700 px-4 text-sm font-semibold text-white disabled:opacity-60" disabled={loading || !userName.trim() || !companyName.trim() || !inviteCode.trim()} onClick={finish} type="button">
              <Building2 size={18} />
              {loading ? "Criando..." : "Criar empresa e continuar"}
            </button>
            <button className="mt-3 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50" onClick={onLogout} type="button">
              <LogOut size={16} />Voltar para o login
            </button>
          </section>
          <section className="rounded-md bg-slate-50 p-5">
            <h2 className="font-semibold">Seu ambiente comeca assim</h2>
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              {["Perfil Proprietario com acesso completo", "Nenhum dado demonstrativo", "Cadastros e financas totalmente zerados", "Separacao segura por empresa", "Convites para Financeiro, Consulta ou outro Proprietario"].map((item) => (
                <p className="flex gap-2" key={item}>
                  <CheckCircle2 className="shrink-0 text-emerald-600" size={18} />
                  {item}
                </p>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
