export type AccountsPayableSummaryItem = {
  label: string;
  value: string;
  helper: string;
};

export function AccountsPayableSummary({ items }: { items: AccountsPayableSummaryItem[] }) {
  return (
    <div className="mb-4 grid gap-4 md:grid-cols-4">
      {items.map((item) => (
        <article className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm" key={item.label}>
          <p className="text-sm font-medium text-slate-500">{item.label}</p>
          <strong className="mt-2 block text-xl text-slate-950">{item.value}</strong>
          <span className="mt-1 block text-xs text-slate-500">{item.helper}</span>
        </article>
      ))}
    </div>
  );
}
