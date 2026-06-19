import { collection, doc, getDocs, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore";
import type { AppUser } from "@/features/auth/types/authTypes";
import type { PlanId } from "@/features/plans/planRules";
import { db, firebaseReady } from "@/lib/firebase/config";
import { tenantPath } from "@/lib/firebase/paths";

export const platformAdminEmails = new Set(["limaalecsander@gmail.com"]);

export type SubscriptionStatus = NonNullable<AppUser["subscriptionStatus"]>;

export type PlatformTenant = {
  aiBalance: number;
  aiIncluded: number;
  id: string;
  name: string;
  nextBillingDate?: string;
  ownerId?: string;
  planId: PlanId;
  subscriptionStatus: SubscriptionStatus;
};

export function isPlatformAdmin(user?: AppUser | null) {
  return Boolean(user?.email && platformAdminEmails.has(user.email.toLowerCase()));
}

export async function listPlatformTenants(): Promise<PlatformTenant[]> {
  if (!firebaseReady || !db) return [];
  const snapshot = await getDocs(query(collection(db, "tenants"), orderBy("name")));
  return snapshot.docs.map((item) => {
    const data = item.data();
    const aiCredits = data.aiCredits || {};
    return {
      aiBalance: Number(aiCredits.balance || 0),
      aiIncluded: Number(aiCredits.included || 0),
      id: item.id,
      name: String(data.name || "Empresa"),
      nextBillingDate: data.nextBillingDate || "",
      ownerId: data.ownerId || "",
      planId: data.planId || "medio",
      subscriptionStatus: data.subscriptionStatus || "ativo",
    } as PlatformTenant;
  });
}

export async function updateTenantSubscription(tenantId: string, updates: { nextBillingDate?: string; planId: PlanId; subscriptionStatus: SubscriptionStatus }) {
  if (!firebaseReady || !db) return;
  await updateDoc(doc(db, tenantPath(tenantId)), { ...updates, updatedAt: serverTimestamp() });
}
