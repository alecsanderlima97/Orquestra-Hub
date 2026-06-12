"use client";

import { BarChart3, Building2, LogIn, PackageCheck, ReceiptText } from "lucide-react";
import { useState } from "react";
import { TextField } from "@/components/ui/TextField";
import { firebaseReady } from "@/lib/firebase/config";
import { loginWithEmail, loginWithGoogle, registerWithEmail, resetPassword } from "../services/authService";
import type { AppUser } from "../types/authTypes";

const demoUser: AppUser = { companyName: "Orquestra Hub Demo", email: "demo@orquestrahub.com", id: "demo-user", name: "Demo Orquestra Hub", role: "Dono", tenantId: "demo-orquestra-hub" };
const modules = [{ detail: "Fluxo em tempo real", icon: BarChart3, title: "Financeiro" }, { detail: "Gestão integrada", icon: Building2, title: "Unidades" }, { detail: "Compras organizadas", icon: PackageCheck, title: "Fornecedores" }, { detail: "Decisões mais claras", icon: ReceiptText, title: "Relatórios" }];

function registrationError(error: unknown) {
  const firebaseError = error as { code?: string; message?: string };
  const code = firebaseError?.code || firebaseError?.message || "";
  if (code.includes("email-already-in-use")) return "Este e-mail já possui uma conta.";
  if (code.includes("invalid-email")) return "Informe um e-mail válido.";
  if (code.includes("weak-password")) return "A senha deve ter pelo menos 6 caracteres.";
  if (code === "invite-invalid") return "O código de convite é inválido.";
  if (code === "name-required") return "Informe seu nome.";
  if (code === "company-required") return "Informe o nome da empresa ou um código de convite.";
  if (code.includes("permission-denied")) return "O acesso ao cadastro foi negado. Atualize a página e tente novamente.";
  if (code.includes("network-request-failed") || code.includes("unavailable")) return "Falha de conexão. Verifique sua internet e tente novamente.";
  return `Não foi possível concluir o cadastro${code ? ` (${code.replace("firebase/", "")})` : ""}.`;
}

export function LoginScreen({ onLogin }: { onLogin: (user: AppUser) => void }) {
  const [email, setEmail] = useState(firebaseReady ? "" : "demo@orquestrahub.com");
  const [password, setPassword] = useState(firebaseReady ? "" : "123456");
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function finishLogin(user: AppUser) { const audio = new Audio("/login_sound.mp3"); audio.volume = 0.32; try { await audio.play(); } catch {} window.setTimeout(() => onLogin(user), 650); }
  async function handleSubmit() { setMessage(""); setLoading(true); try { if (!firebaseReady) { await finishLogin(demoUser); return; } const user = mode === "register" ? await registerWithEmail(name, companyName, email, password, inviteCode) : await loginWithEmail(email, password); if (user) await finishLogin(user); } catch (error) { setMessage(mode === "login" ? "E-mail ou senha inválidos." : registrationError(error)); } finally { setLoading(false); } }
  async function handleGoogle() { setMessage(""); setLoading(true); try { const user = await loginWithGoogle(); if (user) await finishLogin(user); } catch { setMessage("Não foi possível acessar com o Google. Verifique se o provedor está habilitado."); } finally { setLoading(false); } }
  async function handleReset() { if (!email) { setMessage("Informe seu e-mail para recuperar a senha."); return; } try { await resetPassword(email); setMessage("Solicitação enviada. Verifique também as pastas Spam, Lixeira e Promoções. O remetente será do Firebase/Orquestra Hub."); } catch (error) { const code = (error as { code?: string }).code || ""; setMessage(code.includes("unauthorized-continue-uri") ? "O domínio de recuperação precisa ser autorizado no Firebase." : "Não foi possível enviar o link de recuperação. Confira o e-mail e tente novamente."); } }

  return <main className="grid min-h-screen bg-[#f4f8fc] text-slate-950 lg:grid-cols-[1fr_460px]">
    <section className="relative hidden overflow-hidden bg-[#071521] px-12 py-12 text-white lg:flex lg:flex-col"><div className="absolute inset-0 bg-[radial-gradient(circle_at_38%_44%,rgba(23,135,203,0.22),transparent_44%)]" /><div className="login-score" aria-hidden="true"><span /><span /><span /><span /><span /></div><div className="relative"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-200">Orquestra.cs</p><h1 className="mt-3 text-4xl font-bold">Orquestra Hub</h1></div><div className="relative flex flex-1 flex-col justify-center py-8"><div className="grid items-center gap-8 xl:grid-cols-[260px_1fr]"><div className="crystal-stage"><div className="crystal-o" aria-label="O de Orquestra">O</div></div><div className="max-w-xl"><h2 className="text-3xl font-semibold">Gestão empresarial inteligente e modular.</h2><p className="mt-4 text-base leading-7 text-slate-300">Controle financeiro, unidades, fornecedores, compras e decisões em um único ambiente seguro.</p></div></div><div className="mt-12 grid grid-cols-2 gap-3 xl:grid-cols-4">{modules.map(({ detail, icon: Icon, title }) => <div className="login-module" key={title}><Icon size={19} /><div><strong>{title}</strong><span>{detail}</span></div></div>)}</div></div></section>
    <section className="flex items-center justify-center px-5 py-10"><div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-7 shadow-lg shadow-slate-200/60"><div className="mx-auto flex size-20 items-center justify-center lg:hidden"><div className="crystal-o crystal-o-small">O</div></div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-700">Orquestra Hub</p><h2 className="mt-3 text-2xl font-semibold">{mode === "login" ? "Acessar sistema" : "Criar empresa"}</h2><p className="mt-2 text-sm text-slate-600">{mode === "login" ? "Entre com seu usuário para acessar o ambiente financeiro." : "Cadastre seu acesso ao Orquestra Hub."}</p><div className="mt-6 space-y-4">{mode === "register" ? <><TextField label="Nome da empresa" onChange={(event) => setCompanyName(event.target.value)} placeholder="Deixe vazio somente se tiver convite" value={companyName} /><TextField label="Código de convite" onChange={(event) => setInviteCode(event.target.value.toUpperCase())} placeholder="Opcional" value={inviteCode} /><TextField label="Seu nome" onChange={(event) => setName(event.target.value)} placeholder="Seu nome" value={name} /></> : null}<TextField label="E-mail" onChange={(event) => setEmail(event.target.value)} placeholder="email@empresa.com" type="email" value={email} /><TextField label="Senha" onChange={(event) => setPassword(event.target.value)} placeholder="Senha" type="password" value={password} />{message ? <p className="rounded-md bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700">{message}</p> : null}{mode === "login" ? <button className="text-sm font-semibold text-cyan-700" onClick={handleReset} type="button">Esqueci minha senha</button> : null}<button className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-[#087ec1] px-4 text-sm font-semibold text-white hover:bg-[#066da8] disabled:opacity-70" disabled={loading} onClick={handleSubmit} type="button"><LogIn size={18} />{loading ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}</button><button className="h-11 w-full rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100" disabled={loading} onClick={handleGoogle} type="button">Continuar com Google</button><button className="w-full text-sm font-semibold text-cyan-700" onClick={() => { setMode(mode === "login" ? "register" : "login"); setMessage(""); }} type="button">{mode === "login" ? "Ainda não tenho uma conta" : "Já tenho uma conta"}</button><button className="h-11 w-full rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100" onClick={() => finishLogin(demoUser)} type="button">Entrar em modo demo</button></div></div></section>
  </main>;
}
