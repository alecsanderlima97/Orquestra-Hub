"use client";

import { CheckCircle2, Clock3, Sparkles, X } from "lucide-react";
import type { ReleaseNotes } from "@/features/updates/releaseNotes";

export function ReleaseNotesModal({
  error,
  notes,
  onConfirm,
  onDismiss,
  open,
  saving,
}: {
  error?: string;
  notes: ReleaseNotes;
  onConfirm: () => Promise<void>;
  onDismiss: () => void;
  open: boolean;
  saving: boolean;
}) {
  if (!open) return null;

  return (
    <div aria-labelledby="release-notes-title" aria-modal="true" className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]" role="dialog">
      <section className="max-h-[min(720px,calc(100vh-2rem))] w-full max-w-2xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-950 px-5 py-5 text-white sm:px-7">
          <div className="flex gap-3">
            <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-lg bg-cyan-400 text-slate-950">
              <Sparkles size={21} />
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">Atualização do sistema</p>
              <h2 className="mt-1 text-xl font-bold sm:text-2xl" id="release-notes-title">{notes.title}</h2>
              <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-300"><span className="rounded-full bg-white/10 px-2 py-0.5 font-semibold text-cyan-100">v{notes.version}</span><Clock3 size={14} /> Publicada em {notes.publishedAt}</p>
            </div>
          </div>
          <button aria-label="Ler depois" className="rounded-md p-1.5 text-slate-300 transition hover:bg-white/10 hover:text-white" onClick={onDismiss} title="Ler depois" type="button"><X size={20} /></button>
        </header>
        <div className="max-h-[calc(100vh-14rem)] overflow-y-auto p-5 sm:p-7">
          <p className="text-sm leading-6 text-slate-600">{notes.intro}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {notes.items.map((item) => (
              <article className="rounded-lg border border-slate-200 bg-slate-50 p-4" key={item.title}>
                <div className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={18} />
                  <div>
                    <h3 className="text-sm font-semibold text-slate-950">{item.title}</h3>
                    <p className="mt-1 text-sm leading-5 text-slate-600">{item.description}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
          {error ? <p className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p> : null}
          <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button className="h-11 rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50" disabled={saving} onClick={onDismiss} type="button">Ler depois</button>
            <button className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-wait disabled:opacity-60" disabled={saving} onClick={() => void onConfirm()} type="button">
              <CheckCircle2 size={17} />
              {saving ? "Salvando..." : "Entendi, marcar como lido"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
