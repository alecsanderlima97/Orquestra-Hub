import { collection, doc, getDocs, orderBy, query, serverTimestamp, updateDoc, writeBatch } from "firebase/firestore";
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
  lastAccessAt?: number;
  lastSeenAt?: number;
  name: string;
  nextBillingDate?: string;
  ownerId?: string;
  planId: PlanId;
  subscriptionStatus: SubscriptionStatus;
};

export type PlatformPayment = {
  amount: string;
  createdAt?: number;
  id: string;
  method: string;
  nextBillingDate: string;
  notes?: string;
  paidAt: string;
  planId: PlanId;
  referenceMonth: string;
};

export function isPlatformAdmin(user?: AppUser | null) {
  return Boolean(user?.email && platformAdminEmails.has(user.email.toLowerCase()));
}

function timestampToMillis(value: unknown) {
  return typeof (value as { toMillis?: () => number })?.toMillis === "function" ? (value as { toMillis: () => number }).toMillis() : undefined;
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
      lastAccessAt: timestampToMillis(data.lastAccessAt),
      lastSeenAt: timestampToMillis(data.lastSeenAt),
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

export async function listTenantPayments(tenantId: string): Promise<PlatformPayment[]> {
  if (!firebaseReady || !db) return [];
  const snapshot = await getDocs(query(collection(db, "platformPayments", tenantId, "payments"), orderBy("paidAt", "desc")));
  return snapshot.docs.map((item) => {
    const data = item.data();
    return {
      amount: String(data.amount || ""),
      createdAt: timestampToMillis(data.createdAt),
      id: item.id,
      method: String(data.method || "PIX"),
      nextBillingDate: String(data.nextBillingDate || ""),
      notes: String(data.notes || ""),
      paidAt: String(data.paidAt || ""),
      planId: data.planId || "medio",
      referenceMonth: String(data.referenceMonth || ""),
    } as PlatformPayment;
  });
}

export async function confirmTenantPayment(tenantId: string, payment: Omit<PlatformPayment, "createdAt" | "id">) {
  if (!firebaseReady || !db) return;
  const batch = writeBatch(db);
  const tenantRef = doc(db, tenantPath(tenantId));
  const paymentRef = doc(collection(db, "platformPayments", tenantId, "payments"));
  batch.set(paymentRef, { ...payment, createdAt: serverTimestamp() });
  batch.update(tenantRef, {
    lastPaymentAt: payment.paidAt,
    lastPaymentAmount: payment.amount,
    nextBillingDate: payment.nextBillingDate,
    planId: payment.planId,
    subscriptionStatus: "ativo",
    updatedAt: serverTimestamp(),
  });
  await batch.commit();
}
