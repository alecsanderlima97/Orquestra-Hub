"use client";

import { LockKeyhole, LogIn } from "lucide-react";
import { useState } from "react";
import { TextField } from "@/components/ui/TextField";
import { firebaseReady } from "@/lib/firebase/config";
import { loginWithEmail } from "../services/authService";
import type { AppUser } from "../types/authTypes";

const demoUser: AppUser = {
  email: "demo@orquestrahub.com",
  id: "demo-user",
  name: "Demo Orquestra Hub",
  role: "Dono",
};

export function LoginScreen({ onLogin }: { onLogin: (user: AppUser) => void }) {
  const [email, setEmail] = useState("demo@orquestrahub.com");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError("");
    setLoading(true);
    try {
      if (!firebaseReady) {
        onLogin(demoUser);
        return;
      }
      const user = await loginWithEmail(email, password);
      if (user) onLogin(user);
    } catch {
      setError("Email ou senha invalidos.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid min-h-screen bg-slate-100 text-slate-950 lg:grid-cols-[1fr_460px]">
      <section className="hidden bg-slate-950 px-10 py-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">Orquestra.cs</p>
          <h1 className="mt-3 text-4xl font-bold">Orquestra Hub</h1>
        </div>
        <div className="max-w-xl">
          <h2 className="text-3xl font-semibold">Gestao financeira modular para negocios reais.</h2>
          <p className="mt-4 text-base leading-7 text-slate-300">
            Controle lojas, fornecedores, compras, parcelas e baixas em uma base preparada para crescer como SaaS.
          </p>
        </div>
      </section>

      <section className="flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex size-12 items-center justify-center rounded-lg bg-slate-950 text-white">
            <LockKeyhole size={22} />
          </div>
          <h2 className="mt-5 text-2xl font-semibold">Acessar sistema</h2>
          <p className="mt-2 text-sm text-slate-600">
            {firebaseReady ? "Entre com seu usuário cadastrado ou use o modo demo." : "Modo demo ativo até configurar o Firebase."}
          </p>

          <div className="mt-6 space-y-4">
            <TextField label="Email" onChange={(event) => setEmail(event.target.value)} placeholder="email@empresa.com" type="email" value={email} />
            <TextField label="Senha" onChange={(event) => setPassword(event.target.value)} placeholder="Senha" type="password" value={password} />
            {error ? <p className="text-sm font-medium text-rose-700">{error}</p> : null}
            <button
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={loading}
              onClick={handleSubmit}
              type="button"
            >
              <LogIn size={18} />
              {loading ? "Entrando..." : "Entrar"}
            </button>
            <button
              className="h-11 w-full rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              onClick={() => onLogin(demoUser)}
              title="Acessar o sistema com dados demonstrativos enquanto o Firebase Auth é configurado."
              type="button"
            >
              Entrar em modo demo
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
