"use client";

import { Camera, KeyRound, Save, UserRound } from "lucide-react";
import { useMemo, useState, type ChangeEvent } from "react";
import { TextField } from "@/components/ui/TextField";
import type { AppUser } from "@/features/auth/types/authTypes";
import { canManageUsers } from "@/features/users/utils/accessRules";
import { changePassword, currentLoginProvider } from "../services/profileService";

type Props = {
  onCompanySave: (companyName: string) => Promise<void>;
  onPasswordChange?: () => Promise<void>;
  onProfileSave: (name: string, photoUrl: string) => Promise<void>;
  user: AppUser;
};

function readImage(event: ChangeEvent<HTMLInputElement>, callback: (value: string) => void) {
  const file = event.target.files?.[0];
  if (!file) return;
  if (!file.type.startsWith("image/") || file.size > 350 * 1024) {
    callback("");
    return;
  }
  const reader = new FileReader();
  reader.onload = () => callback(String(reader.result || ""));
  reader.readAsDataURL(file);
}

export function UserProfile({ onCompanySave, onProfileSave, user }: Props) {
  const [name, setName] = useState(user.name);
  const [companyName, setCompanyName] = useState(user.companyName);
  const [photoUrl, setPhotoUrl] = useState(user.photoUrl || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const provider = useMemo(() => currentLoginProvider(), []);
  const canEditCompany = canManageUsers(user.role);

  async function saveProfile() {
    setSaving(true);
    setMessage("");
    try {
      await onProfileSave(name, photoUrl);
      setMessage("Perfil atualizado com sucesso.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível salvar o perfil.");
    } finally {
      setSaving(false);
    }
  }

  async function saveCompany() {
    setSaving(true);
    setMessage("");
    try {
      await onCompanySave(companyName);
      setMessage("Empresa atualizada com sucesso.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível salvar a empresa.");
    } finally {
      setSaving(false);
    }
  }

  async function submitPassword() {
    setSaving(true);
    setMessage("");
    try {
      await changePassword(currentPassword, nextPassword);
      setCurrentPassword("");
      setNextPassword("");
      setMessage("Senha atualizada com sucesso.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível alterar a senha.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[280px_1fr]">
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-center shadow-sm">
        <div className="mx-auto flex size-24 items-center justify-center overflow-hidden rounded-full bg-cyan-50 text-cyan-700">
          {photoUrl ? <span aria-label={user.name} className="h-full w-full bg-cover bg-center" role="img" style={{ backgroundImage: `url(${photoUrl})` }} /> : <UserRound size={40} />}
        </div>
        <label className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
          <Camera size={16} />
          Foto
          <input accept="image/*" className="sr-only" onChange={(event) => readImage(event, setPhotoUrl)} type="file" />
        </label>
        <h3 className="mt-4 text-lg font-semibold">{user.name}</h3>
        <p className="mt-1 text-sm text-slate-500">{user.email}</p>
        <span className="mt-4 inline-block rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">{user.role}</span>
      </div>

      <div className="space-y-5">
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="font-semibold">Perfil</h3>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <TextField label="Nome" onChange={(event) => setName(event.target.value)} placeholder="Seu nome" value={name} />
            <TextField label="E-mail" placeholder="E-mail" value={user.email} />
          </div>
          <button className="mt-4 inline-flex h-10 items-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white disabled:opacity-60" disabled={saving} onClick={saveProfile} type="button"><Save size={16} />Salvar perfil</button>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="font-semibold">Empresa</h3>
          <div className="mt-5">
            <TextField label="Nome da empresa" onChange={(event) => setCompanyName(event.target.value)} placeholder="Nome da empresa" value={companyName} />
          </div>
          <button className="mt-4 inline-flex h-10 items-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white disabled:opacity-60" disabled={saving || !canEditCompany} onClick={saveCompany} title={canEditCompany ? "Salvar empresa" : "Somente Proprietário pode alterar a empresa"} type="button"><Save size={16} />Salvar empresa</button>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="font-semibold">Senha de login</h3>
          {provider === "google" ? <p className="mt-2 text-sm text-slate-600">Esta conta entra pelo Google. A senha é gerenciada na sua conta Google.</p> : <div className="mt-5 grid gap-4 sm:grid-cols-2"><TextField label="Senha atual" onChange={(event) => setCurrentPassword(event.target.value)} placeholder="Senha atual" type="password" value={currentPassword} /><TextField label="Nova senha" onChange={(event) => setNextPassword(event.target.value)} placeholder="Mínimo 6 caracteres" type="password" value={nextPassword} /><button className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white disabled:opacity-60 sm:col-span-2" disabled={saving || !currentPassword || !nextPassword} onClick={submitPassword} type="button"><KeyRound size={16} />Alterar senha</button></div>}
        </section>

        {message ? <p className="rounded-md bg-slate-100 px-4 py-3 text-sm font-medium text-slate-700">{message}</p> : null}
      </div>
    </div>
  );
}
