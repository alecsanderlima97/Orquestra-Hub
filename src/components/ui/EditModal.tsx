"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { TextField } from "@/components/ui/TextField";
import { formatBRL, formatCep, formatCnpj, formatPhone, toTitleCaseBR } from "@/lib/formatters/br";

export type EditField = {
  key: string;
  label: string;
  type?: string;
  mask?: "currency" | "cep" | "cnpj" | "phone" | "title" | "upper";
  value: string;
};

export function EditModal({
  fields,
  onClose,
  onSave,
  passwordRequired = false,
  title,
}: {
  fields: EditField[];
  onClose: () => void;
  onSave: (values: Record<string, string>, password: string) => Promise<void> | void;
  passwordRequired?: boolean;
  title: string;
}) {
  const [values, setValues] = useState(() => Object.fromEntries(fields.map((field) => [field.key, field.value])));
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (passwordRequired && !password) {
      setError("Informe sua senha de login para editar uma conta paga.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave(values, password);
    } catch {
      setError("Não foi possível salvar. Verifique os dados e a senha informada.");
    } finally {
      setSaving(false);
    }
  }

  function maskValue(field: EditField, value: string) {
    if (field.mask === "currency") return formatBRL(value);
    if (field.mask === "cep") return formatCep(value);
    if (field.mask === "cnpj") return formatCnpj(value);
    if (field.mask === "phone") return formatPhone(value);
    if (field.mask === "upper") return value.toUpperCase();
    return value;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/45 px-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
          <button aria-label="Fechar" className="rounded-md p-2 text-slate-500 hover:bg-slate-100" onClick={onClose} title="Fechar sem salvar" type="button">
            <X size={18} />
          </button>
        </div>
        <div className="mt-5 grid gap-4">
          {fields.map((field) => (
            <TextField
              key={field.key}
              label={field.label}
              onBlur={() => field.mask === "title" && setValues((current) => ({ ...current, [field.key]: toTitleCaseBR(current[field.key] || "") }))}
              onChange={(event) => setValues((current) => ({ ...current, [field.key]: maskValue(field, event.target.value) }))}
              placeholder={field.label}
              type={field.type}
              value={values[field.key] || ""}
            />
          ))}
          {passwordRequired ? (
            <TextField label="Senha de login" onChange={(event) => setPassword(event.target.value)} placeholder="Confirme sua senha" type="password" value={password} />
          ) : null}
          {error ? <p className="rounded-md bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</p> : null}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100" onClick={onClose} type="button">Cancelar</button>
          <button className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60" disabled={saving} onClick={handleSave} type="button">
            {saving ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      </div>
    </div>
  );
}
