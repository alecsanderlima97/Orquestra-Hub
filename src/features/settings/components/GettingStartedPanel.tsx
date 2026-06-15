import { BookOpen, Building2, FileText, ShieldCheck, Store, Truck } from "lucide-react";

const steps = [
  { icon: Building2, title: "Empresa", text: "Confirme o negócio ativo ou adicione outro negócio." },
  { icon: Store, title: "Unidades", text: "Cadastre lojas, filiais ou pontos de operação." },
  { icon: Truck, title: "Fornecedores", text: "Registre contatos e formas de pagamento." },
  { icon: FileText, title: "Compras", text: "Lance notas, produtos, boletos e parcelas." },
];

export function GettingStartedPanel() { return <section className="theme-surface rounded-lg border border-slate-200 bg-white shadow-sm"><header className="border-b border-slate-200 px-5 py-4"><div className="flex items-center gap-3"><BookOpen className="text-cyan-700" size={21} /><div><h3 className="font-semibold">Leia-me · Primeiros passos</h3><p className="text-sm text-slate-500">Sequência recomendada para começar a usar o sistema.</p></div></div></header><div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-4">{steps.map(({ icon: Icon, text, title }, index) => <article className="rounded-md border border-slate-200 p-4" key={title}><div className="flex items-center gap-2"><span className="flex size-7 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white">{index + 1}</span><Icon size={18} /><strong>{title}</strong></div><p className="mt-3 text-sm text-slate-600">{text}</p></article>)}</div><div className="border-t border-slate-200 px-5 py-4 text-sm text-slate-600"><ShieldCheck className="mr-2 inline text-emerald-600" size={17} /><b>Proprietário</b> administra tudo; <b>Financeiro</b> altera dados operacionais; <b>Consulta</b> apenas visualiza.</div></section>; }
