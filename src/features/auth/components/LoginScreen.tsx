"use client";

import { LogIn } from "lucide-react";
import { useState } from "react";
import { TextField } from "@/components/ui/TextField";
import { firebaseReady } from "@/lib/firebase/config";
import { loginWithEmail } from "../services/authService";
import type { AppUser } from "../types/authTypes";

const demoUser: AppUser = { email: "demo@orquestrahub.com", id: "demo-user", name: "Demo Orquestra Hub", role: "Dono" };

export function LoginScreen({ onLogin }: { onLogin: (user: AppUser) => void }) {
  const [email, setEmail] = useState(firebaseReady ? "" : "demo@orquestrahub.com");
  const [password, setPassword] = useState(firebaseReady ? "" : "123456");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function finishLogin(user: AppUser) {
    const audio = new Audio("/login_sound.mp3");
    audio.volume = 0.32;
    try { await audio.play(); } catch { /* O navegador pode bloquear áudio automático. */ }
    window.setTimeout(() => onLogin(user), 650);
  }

  async function handleSubmit() {
    setError(""); setLoading(true);
    try {
      if (!firebaseReady) { await finishLogin(demoUser); return; }
      const user = await loginWithEmail(email, password);
      if (user) await finishLogin(user);
    } catch { setError("E-mail ou senha inválidos."); }
    finally { setLoading(false); }
  }

  return (
    <main className="grid min-h-screen bg-[#f4f8fc] text-slate-950 lg:grid-cols-[1fr_460px]">
      <section className="relative hidden overflow-hidden bg-[#071521] px-12 py-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_40%,rgba(23,135,203,0.18),transparent_42%)]" />
        <div className="relative"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-200">Orquestra.cs</p><h1 className="mt-3 text-4xl font-bold">Orquestra Hub</h1></div>
        <div className="relative flex items-center gap-10">
          <div className="crystal-o" aria-label="O de Orquestra">O</div>
          <div className="max-w-lg"><h2 className="text-3xl font-semibold">Gestão empresarial inteligente e modular.</h2><p className="mt-4 text-base leading-7 text-slate-300">Controle financeiro, unidades, fornecedores, compras e decisões em um único ambiente seguro.</p></div>
        </div>
      </section>
      <section className="flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-7 shadow-lg shadow-slate-200/60">
          <div className="mx-auto flex size-20 items-center justify-center lg:hidden"><div className="crystal-o crystal-o-small">O</div></div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-700">Orquestra Hub</p>
          <h2 className="mt-3 text-2xl font-semibold">Acessar sistema</h2>
          <p className="mt-2 text-sm text-slate-600">Entre com seu usuário para acessar o ambiente financeiro.</p>
          <div className="mt-6 space-y-4">
            <TextField label="E-mail" onChange={(event) => setEmail(event.target.value)} placeholder="email@empresa.com" type="email" value={email} />
            <TextField label="Senha" onChange={(event) => setPassword(event.target.value)} placeholder="Senha" type="password" value={password} />
            {error ? <p className="text-sm font-medium text-rose-700">{error}</p> : null}
            <button className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#087ec1] px-4 text-sm font-semibold text-white hover:bg-[#066da8] disabled:opacity-70" disabled={loading} onClick={handleSubmit} type="button"><LogIn size={18} />{loading ? "Entrando..." : "Entrar"}</button>
            <button className="h-11 w-full rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100" onClick={() => finishLogin(demoUser)} type="button">Entrar em modo demo</button>
          </div>
        </div>
      </section>
    </main>
  );
}
