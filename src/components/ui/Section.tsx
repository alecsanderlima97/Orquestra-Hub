import type { ReactNode } from "react";

export function Section({
  title,
  description,
  children,
  id,
}: {
  title: string;
  description: string;
  children: ReactNode;
  id: string;
}) {
  return (
    <section aria-labelledby={`${id}-title`} className="scroll-mt-28 lg:scroll-mt-6" id={id}>
      <div className="mb-5 border-b border-slate-200 pb-4">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-700">
          <span>Orquestra Hub</span>
        </div>
        <h2 className="mt-2 text-xl font-semibold text-slate-950" id={`${id}-title`}>{title}</h2>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
      </div>
      {children}
    </section>
  );
}
