import { Timestamp } from "firebase/firestore";
import { describe, expect, it } from "vitest";
import type { AppUser } from "@/features/auth/types/authTypes";
import { canManageUsers, canWrite, isInviteAvailable, wouldRemoveLastOwner } from "./accessRules";

const baseUser = { companyName: "Empresa", email: "a@a.com", name: "Usuário", tenantId: "tenant" };
const user = (id: string, role: AppUser["role"]): AppUser => ({ ...baseUser, id, role });

describe("regras de acesso", () => {
  it("separa consulta, financeiro e dono", () => {
    expect(canWrite("Consulta")).toBe(false);
    expect(canWrite("Financeiro")).toBe(true);
    expect(canWrite("Dono")).toBe(true);
    expect(canManageUsers("Financeiro")).toBe(false);
    expect(canManageUsers("Dono")).toBe(true);
  });

  it("bloqueia a remoção do último dono", () => {
    expect(wouldRemoveLastOwner([user("1", "Dono"), user("2", "Financeiro")], "1", "Consulta")).toBe(true);
    expect(wouldRemoveLastOwner([user("1", "Dono"), user("2", "Dono")], "1", "Consulta")).toBe(false);
  });

  it("aceita apenas convite ativo e não vencido", () => {
    const invite = { code: "ABC12345", companyName: "Empresa", role: "Consulta" as const, status: "Ativo" as const, tenantId: "tenant" };
    expect(isInviteAvailable({ ...invite, expiresAt: Timestamp.fromMillis(2_000) }, 1_000)).toBe(true);
    expect(isInviteAvailable({ ...invite, expiresAt: Timestamp.fromMillis(500) }, 1_000)).toBe(false);
    expect(isInviteAvailable({ ...invite, status: "Usado" }, 1_000)).toBe(false);
  });
});
