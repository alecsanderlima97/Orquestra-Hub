"use client";

import { Ban, Copy, RefreshCw, UserPlus } from "lucide-react";
import { useState } from "react";
import type { AppUser } from "@/features/auth/types/authTypes";
import type { Invite } from "../services/inviteService";

type Props = {
  currentUserId: string;
  invites: Invite[];
  onCancelInvite: (code: string) => Promise<void>;
  onCreateInvite: (role: Invite["role"]) => Promise<void>;
  onRoleChange: (id: string, role: AppUser["role"]) => void;
  userLimit: number;
  users: AppUser[];
};

export function UsersPanel({ currentUserId, invites, onCancelInvite, onCreateInvite, onRoleChange, userLimit, users }: Props) {
  const [inviteRole, setInviteRole] = useState<Invite["role"]>("Financeiro");
  const [loading, setLoading] = useState(false);
  const activeInviteCount = invites.filter((invite) => invite.status === "Ativo").length;
  const usedUsers = users.length + activeInviteCount;
  const limitReached = usedUsers >= userLimit;

  async function generate() {
    if (limitReached) return;
    setLoading(true);
    try {
      await onCreateInvite(inviteRole);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-5 py-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="font-semibold">Usuarios e permissoes</h3>
            <p className="mt-1 text-sm text-slate-500">Proprietario administra; Financeiro altera dados; Consulta apenas visualiza.</p>
          </div>
          <span className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${limitReached ? "bg-rose-100 text-rose-800" : "bg-cyan-50 text-cyan-800"}`}>
            Usuarios: {usedUsers} de {userLimit}
          </span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <select className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm disabled:bg-slate-100" disabled={limitReached} onChange={(event) => setInviteRole(event.target.value as Invite["role"])} value={inviteRole}>
            <option value="Proprietário">Proprietario</option>
            <option>Financeiro</option>
            <option>Consulta</option>
          </select>
          <button className="inline-flex h-10 items-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white disabled:opacity-60" disabled={loading || limitReached} onClick={generate} title={limitReached ? "Limite de usuarios do plano atingido" : "Gerar convite de usuario"} type="button">
            <UserPlus size={16} />
            {loading ? "Gerando..." : "Gerar convite"}
          </button>
        </div>
        {limitReached ? <p className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">Limite de usuarios do plano atingido. Cancele um convite ativo, remova um usuario ou altere o plano.</p> : null}
      </div>

      <div className="border-b border-slate-200 px-5 py-4">
        <h4 className="text-sm font-semibold">Convites</h4>
        <div className="mt-3 space-y-2">
          {invites.length ? invites.map((invite) => (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-3" key={invite.code}>
              <div>
                <strong className="text-sm">{invite.code}</strong>
                <p className="text-xs text-slate-500">{invite.role} - {invite.status} - validade de 7 dias</p>
              </div>
              <div className="flex gap-2">
                {invite.status === "Ativo" ? <>
                  <button className="rounded-md border border-slate-200 bg-white p-2" onClick={() => navigator.clipboard.writeText(invite.code)} title="Copiar codigo" type="button"><Copy size={15} /></button>
                  <button className="rounded-md border border-slate-200 bg-white p-2 text-rose-700" onClick={() => onCancelInvite(invite.code)} title="Cancelar convite" type="button"><Ban size={15} /></button>
                </> : <button className="rounded-md border border-slate-200 bg-white p-2" disabled={limitReached} onClick={() => onCreateInvite(invite.role)} title="Gerar novo convite" type="button"><RefreshCw size={15} /></button>}
              </div>
            </div>
          )) : <p className="text-sm text-slate-500">Nenhum convite gerado.</p>}
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {users.map((item) => (
          <div className="flex flex-col justify-between gap-3 px-5 py-4 sm:flex-row sm:items-center" key={item.id}>
            <div>
              <strong>{item.name}</strong>
              <p className="text-sm text-slate-500">{item.email}</p>
            </div>
            <select className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm disabled:bg-slate-100" disabled={item.id === currentUserId} onChange={(event) => onRoleChange(item.id, event.target.value as AppUser["role"])} title={item.id === currentUserId ? "Seu proprio perfil nao pode ser alterado aqui" : "Alterar permissao"} value={item.role === "Dono" ? "Proprietário" : item.role}>
              <option value="Proprietário">Proprietario</option>
              <option>Financeiro</option>
              <option>Consulta</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}
