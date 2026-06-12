"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState, type ChangeEvent, type FocusEvent } from "react";

export function TextField({
  label,
  onBlur,
  placeholder,
  value,
  name,
  type = "text",
  onChange,
}: {
  label: string;
  placeholder: string;
  value?: string;
  name?: string;
  type?: string;
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
  onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <span className="relative mt-2 block">
        <input
          className={`h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-slate-950 focus:ring-2 focus:ring-slate-200 ${isPassword ? "pr-11" : ""}`}
          name={name}
          onBlur={onBlur}
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
