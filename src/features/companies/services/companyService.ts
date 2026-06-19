import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import type { AppUser, CompanyMembership } from "@/features/auth/types/authTypes";
import { defaultPlanId, getPlanRules } from "@/features/plans/planRules";
import { db, firebaseReady } from "@/lib/firebase/config";
import { toTitleCaseBR } from "@/lib/formatters/br";
import { tenantPath } from "@/lib/firebase/paths";

const defaultPlan = getPlanRules(defaultPlanId);

export async function createCompany(user: AppUser, name: string): Promise<CompanyMembership> {
  const companyName = toTitleCaseBR(name.trim());
  if (!companyName) throw new Error("Informe o nome da empresa.");
  const tenantId = crypto.randomUUID();
  const membership: CompanyMembership = { companyName, planId: defaultPlanId, role: "Proprietário", subscriptionStatus: "ativo", tenantId };
  if (!firebaseReady || !db || user.id === "demo-user") return membership;

  await setDoc(doc(db, tenantPath(tenantId)), {
    aiCredits: {
      balance: defaultPlan.initialAiCredits,
      included: defaultPlan.initialAiCredits,
      renewalMonth: new Date().toISOString().slice(0, 7),
      status: "Ativo",
      used: 0,
    },
    createdAt: serverTimestamp(),
    name: companyName,
    ownerId: user.id,
    planId: defaultPlanId,
    status: "Ativo",
    subscriptionStatus: "ativo",
  });
  try {
    await setDoc(doc(db, `${tenantPath(tenantId)}/users/${user.id}`), { createdAt: serverTimestamp(), email: user.email, name: user.name, role: "Proprietário", userId: user.id });
    await setDoc(doc(db, `userTenants/${user.id}/memberships/${tenantId}`), { companyName, createdAt: serverTimestamp(), role: "Proprietário" });
  } catch (error) {
    throw new Error("Não foi possível concluir a criação da empresa. Tente novamente.", { cause: error });
  }
  return membership;
}
