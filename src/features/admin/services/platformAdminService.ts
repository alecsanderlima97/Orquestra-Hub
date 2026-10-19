import { collection, doc, getDocs, orderBy, query, serverTimestamp, updateDoc, writeBatch } from "firebase/firestore";
import type { AppUser } from "@/features/auth/types/authTypes";
import { normalizeSubscriptionGraceDays } from "@/features/billing/subscriptionRules";
import type { PortalSnapshotSyncResponse } from "@/features/connectors/types";
import type { PlanId } from "@/features/plans/planRules";
import { auth, db, firebaseReady } from "@/lib/firebase/config";
import { tenantPath } from "@/lib/firebase/paths";

export const platformAdminEmails = new Set(["orquestracs@gmail.com"]);

export type SubscriptionStatus = NonNullable<AppUser["subscriptionStatus"]>;

export type PlatformTenant = {
  address?: string;
  addressComplement?: string;
  addressNumber?: string;
  aiBalance: number;
  aiIncluded: number;
  billingStatus?: string;
  billingDay?: string;
  cep?: string;
  city?: string;
  commercialNotes?: string;
  contactEmail?: string;
  contactName?: string;
  contactPhone?: string;
  dataVersion?: number;
  document?: string;
  documentType?: "CPF" | "CNPJ";
  externalCustomerId?: string;
  graceDays?: number;
  id: string;
  lastAccessAt?: number;
  lastSeenAt?: number;
  portalLastSyncedAt?: number;
  portalSyncError?: string;
  portalSyncStatus?: "success" | "error";
  updatedAt?: number;
  legalName?: string;
  mapUrl?: string;
  monthlyFee?: string;
  neighborhood?: string;
  name: string;
  nextBillingDate?: string;
  lastPaymentAmount?: number;
  lastPaymentAt?: string;
  lastPaymentProviderId?: string;
  ownerId?: string;
  paymentMethod?: string;
  planId: PlanId;
  startDate?: string;
  state?: string;
  subscriptionStatus: SubscriptionStatus;
  tradeName?: string;
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
  return Boolean(user?.email && platformAdminEmails.has(user.email.trim().toLowerCase()));
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
      billingStatus: String(data.billingStatus || ""),
      address: data.address || "",
      addressComplement: data.addressComplement || "",
      addressNumber: data.addressNumber || "",
      billingDay: data.billingDay || "",
      cep: data.cep || "",
      city: data.city || "",
      commercialNotes: data.commercialNotes || "",
      contactEmail: data.contactEmail || "",
      contactName: data.contactName || "",
      contactPhone: data.contactPhone || "",
      dataVersion: Number(data.portalDataVersion || 1),
      document: data.document || "",
      documentType: data.documentType || "",
      externalCustomerId: String(data.externalCustomerId || `orquestra_hub_${item.id}`),
      graceDays: normalizeSubscriptionGraceDays(data.graceDays),
      id: item.id,
      lastAccessAt: timestampToMillis(data.lastAccessAt),
      lastSeenAt: timestampToMillis(data.lastSeenAt),
      lastPaymentAmount: Number(data.lastPaymentAmount || 0) || undefined,
      lastPaymentAt: String(data.lastPaymentAt || ""),
      lastPaymentProviderId: String(data.lastPaymentProviderId || ""),
      legalName: data.legalName || "",
      mapUrl: data.mapUrl || "",
      monthlyFee: data.monthlyFee || "",
      neighborhood: data.neighborhood || "",
      name: String(data.name || "Empresa"),
      nextBillingDate: data.nextBillingDate || "",
      ownerId: data.ownerId || "",
      paymentMethod: data.paymentMethod || "",
      planId: data.planId || "medio",
      startDate: data.startDate || "",
      state: data.state || "",
      subscriptionStatus: data.subscriptionStatus || "ativo",
      tradeName: data.tradeName || "",
      portalLastSyncedAt: timestampToMillis(data.portalLastSyncedAt),
      portalSyncError: String(data.portalSyncError || ""),
      portalSyncStatus: data.portalSyncStatus === "success" || data.portalSyncStatus === "error" ? data.portalSyncStatus : undefined,
      updatedAt: timestampToMillis(data.updatedAt),
    } as PlatformTenant;
  });
}

export async function updateTenantSubscription(tenantId: string, updates: Partial<Pick<PlatformTenant, "address" | "addressComplement" | "addressNumber" | "billingDay" | "cep" | "city" | "commercialNotes" | "contactEmail" | "contactName" | "contactPhone" | "document" | "documentType" | "graceDays" | "legalName" | "mapUrl" | "monthlyFee" | "name" | "neighborhood" | "nextBillingDate" | "paymentMethod" | "planId" | "startDate" | "state" | "subscriptionStatus" | "tradeName">> & { planId: PlanId; subscriptionStatus: SubscriptionStatus }) {
  if (!firebaseReady || !db) return;
  await updateDoc(doc(db, tenantPath(tenantId)), { ...updates, ...(updates.graceDays === undefined ? {} : { graceDays: normalizeSubscriptionGraceDays(updates.graceDays) }), updatedAt: serverTimestamp() });
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
    billingStatus: "paid",
    lastPaymentAt: payment.paidAt,
    lastPaymentAmount: payment.amount,
    lastPaymentProviderId: "manual",
    nextBillingDate: payment.nextBillingDate,
    planId: payment.planId,
    subscriptionStatus: "ativo",
    updatedAt: serverTimestamp(),
  });
  await batch.commit();
}

export async function syncPortalSnapshot(): Promise<PortalSnapshotSyncResponse> {
  if (!auth?.currentUser) throw new Error("Sessão do Admin Orquestra.cs não encontrada.");
  const token = await auth.currentUser.getIdToken();
  const response = await fetch("/api/connectors/snapshot", {
    headers: { Authorization: `Bearer ${token}` },
    method: "POST",
  });
  const body = await response.json().catch(() => ({})) as Partial<PortalSnapshotSyncResponse> & { error?: string };
  if (!response.ok || !body.ok || !body.summary) throw new Error(body.error || "Não foi possível sincronizar o Portal Orquestra.cs.");
  return body as PortalSnapshotSyncResponse;
}
