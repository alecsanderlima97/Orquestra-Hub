"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState, type ChangeEvent, type FocusEvent } from "react";
import { toTitleCaseBR } from "@/lib/formatters/br";

export function TextField({
  label,
  onBlur,
  placeholder,
  value,
  name,
  type = "text",
  onChange,
  autoCapitalizeWords = true,
}: {
  label: string;
  placeholder: string;
  value?: string;
  name?: string;
  type?: string;
  autoCapitalizeWords?: boolean;
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const shouldCapitalize = autoCapitalizeWords && ["text", "search"].includes(type);

  function handleBlur(event: FocusEvent<HTMLInputElement>) {
    if (shouldCapitalize && event.target.value) {
      event.target.value = toTitleCaseBR(event.target.value);
      onChange?.(event as unknown as ChangeEvent<HTMLInputElement>);
    }
    onBlur?.(event);
  }

  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <span className="relative mt-2 block">
        <input
          className={`h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200 ${isPassword ? "pr-11" : ""}`}
          name={name}
          onBlur={handleBlur}
          onChange={onChange}
          placeholder={placeholder}
          type={isPassword && showPassword ? "text" : type}
          value={value}
        />
        {isPassword ? <button
          aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-500 hover:text-slate-900"
          onClick={() => setShowPassword((visible) => !visible)}
          title={showPassword ? "Ocultar senha" : "Mostrar senha"}
          type="button"
        >{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button> : null}
      </span>
    </label>
  );
}
