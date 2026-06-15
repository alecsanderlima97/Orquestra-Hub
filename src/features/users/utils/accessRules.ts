import type { AppUser } from "@/features/auth/types/authTypes";
import type { Invite } from "../services/inviteService";

export function canWrite(role: AppUser["role"]) {
  return role === "Proprietário" || role === "Dono" || role === "Financeiro";
}

export function canManageUsers(role: AppUser["role"]) {
  return role === "Proprietário" || role === "Dono";
}

export function isInviteAvailable(invite: Invite, now = Date.now()) {
  return invite.status === "Ativo" && (!invite.expiresAt || invite.expiresAt.toMillis() >= now);
}

export function wouldRemoveLastOwner(users: AppUser[], userId: string, nextRole: AppUser["role"]) {
  const target = users.find((user) => user.id === userId);
  const isOwner = (role: AppUser["role"]) => role === "Proprietário" || role === "Dono";
  return Boolean(target && isOwner(target.role) && !isOwner(nextRole) && users.filter((user) => isOwner(user.role)).length <= 1);
}
