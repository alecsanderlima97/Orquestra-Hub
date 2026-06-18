"use client";

import { Building2, CheckCircle2, Sparkles } from "lucide-react";
import { useState } from "react";
import { TextField } from "@/components/ui/TextField";
import type { AppUser } from "@/features/auth/types/authTypes";

export function FirstAccessOnboarding({ onComplete, user }: { onComplete: (companyName: string) => Promise<void>; user: AppUser }) {
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function finish() {
    const finalName = companyName.trim();
    if (!finalName) {
      setError("Informe o nome da empresa para iniciar o uso.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onComplete(finalName);
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
          <div className="flex items-center gap-3 text-cyan-300">
            <Sparkles size={22} />
            <span className="text-sm font-semibold uppercase">Primeiro acesso obrigatorio</span>
          </div>
          <h1 className="mt-3 text-3xl font-bold">Bem-vindo ao Orquestra Hub, {user.name.split(" ")[0]}.</h1>
          <p className="mt-2 text-slate-300">Antes de usar o sistema, cadastre a empresa onde seus lancamentos serao salvos.</p>
        </header>
        <div className="grid gap-7 p-7 md:grid-cols-2">
          <section>
            <h2 className="font-semibold">Cadastre sua primeira empresa</h2>
            <p className="mt-1 text-sm text-slate-600">Esse cadastro cria seu ambiente online exclusivo. Depois voce podera convidar outros usuarios.</p>
            <div className="mt-5">
              <TextField label="Nome da empresa" onChange={(event) => setCompanyName(event.target.value)} placeholder="Ex.: Caixa Moda" value={companyName} />
            </div>
            {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
            <button className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-cyan-700 px-4 text-sm font-semibold text-white disabled:opacity-60" disabled={loading || !companyName.trim()} onClick={finish} type="button">
              <Building2 size={18} />
              {loading ? "Criando..." : "Criar empresa e continuar"}
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
