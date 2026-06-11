import { Bell, Clock3, Database, ShieldCheck } from "lucide-react";

export function SystemSettings() {
  const settings = [
    { icon: Clock3, title: "Região e horário", value: "Português (Brasil) · Brasília" },
    { icon: Database, title: "Banco de dados", value: "Firebase Firestore conectado" },
    { icon: ShieldCheck, title: "Segurança", value: "Autenticação e regras por empresa" },
    { icon: Bell, title: "Alertas financeiros", value: "Preparado para lembretes de vencimento" },
  ];
  return <div className="grid gap-4 md:grid-cols-2">{settings.map(({ icon: Icon, title, value }) => <article className="flex gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm" key={title}><div className="flex size-11 items-center justify-center rounded-md bg-cyan-50 text-cyan-700"><Icon size={21} /></div><div><h3 className="font-semibold">{title}</h3><p className="mt-1 text-sm text-slate-600">{value}</p></div></article>)}</div>;
}
