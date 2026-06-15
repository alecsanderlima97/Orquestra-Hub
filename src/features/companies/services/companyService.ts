import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db, firebaseReady } from "@/lib/firebase/config";
import { tenantPath } from "@/lib/firebase/paths";
import { toTitleCaseBR } from "@/lib/formatters/br";
import type { AppUser, CompanyMembership } from "@/features/auth/types/authTypes";

export async function createCompany(user: AppUser, name: string): Promise<CompanyMembership> {
  const companyName = toTitleCaseBR(name.trim());
  if (!companyName) throw new Error("Informe o nome da empresa.");
  const tenantId = crypto.randomUUID();
  const membership: CompanyMembership = { companyName, role: "Proprietário", tenantId };
  if (!firebaseReady || !db || user.id === "demo-user") return membership;

  await setDoc(doc(db, tenantPath(tenantId)), { createdAt: serverTimestamp(), name: companyName, ownerId: user.id, status: "Ativo" });
  try {
    await setDoc(doc(db, `${tenantPath(tenantId)}/users/${user.id}`), { createdAt: serverTimestamp(), email: user.email, name: user.name, role: "Proprietário", userId: user.id });
    await setDoc(doc(db, `userTenants/${user.id}/memberships/${tenantId}`), { companyName, createdAt: serverTimestamp(), role: "Proprietário" });
  } catch (error) {
    throw new Error("Não foi possível concluir a criação da empresa. Tente novamente.", { cause: error });
  }
  return membership;
}
