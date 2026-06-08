import { SelectField } from "@/components/ui/SelectField";
import type { AccountPayable } from "../types/accountPayableTypes";

export type AccountFilters = {
  status: "Todos" | AccountPayable["status"];
  store: string;
  supplier: string;
};

export function AccountsPayableFilters({
  filters,
  onChange,
  storeOptions,
  supplierOptions,
}: {
  filters: AccountFilters;
  onChange: (filters: AccountFilters) => void;
  storeOptions: string[];
  supplierOptions: string[];
}) {
  return (
    <div className="mb-4 grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-3">
      <SelectField
        label="Status"
        onChange={(status) => onChange({ ...filters, status: status as AccountFilters["status"] })}
        options={["Todos", "Aberto", "Atrasado", "Pago"]}
        value={filters.status}
      />
      <SelectField
        label="Loja"
        onChange={(store) => onChange({ ...filters, store })}
        options={["Todas", ...storeOptions]}
        value={filters.store}
      />
      <SelectField
        label="Fornecedor"
        onChange={(supplier) => onChange({ ...filters, supplier })}
        options={["Todos", ...supplierOptions]}
        value={filters.supplier}
      />
    </div>
  );
}
