import { getPlanRules, normalizePlanId, type PlanId } from "@/features/plans/planRules";
import { firebaseAdmin } from "@/lib/firebase/admin";
import type { PortalSnapshotSyncSummary } from "@/features/connectors/types";

const SOURCE_SYSTEM = "orquestra_hub" as const;
const CONTRACT_VERSION = "v1" as const;
const DATA_VERSION = 1;
const ONLINE_WINDOW_MS = 2 * 60 * 1000;

type FirestoreData = Record<string, unknown>;

function stringValue(value: unknown) {
  const normalized = String(value ?? "").trim();
  return normalized || null;
}

function timestampToMillis(value: unknown) {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return value;
  if (typeof (value as { toMillis?: () => number })?.toMillis === "function") return (value as { toMillis: () => number }).toMillis();
  if (typeof (value as { toDate?: () => Date })?.toDate === "function") return (value as { toDate: () => Date }).toDate().getTime();
  if (typeof (value as { seconds?: number })?.seconds === "number") return Number((value as { seconds: number }).seconds) * 1000;
  return undefined;
}

function isoValue(value: unknown) {
  const millis = timestampToMillis(value);
  if (millis !== undefined && Number.isFinite(millis)) return new Date(millis).toISOString();
  const text = stringValue(value);
  if (!text) return null;
  const parsed = Date.parse(text);
  return Number.isNaN(parsed) ? text : new Date(parsed).toISOString();
}

function dateValue(value: unknown) {
  return stringValue(value);
}

function deviceValue(data: FirestoreData) {
  return stringValue(data.lastDevice || data.device || data.deviceType);
}

function isOnline(value: string | null, now: number) {
  return Boolean(value && now - Date.parse(value) <= ONLINE_WINDOW_MS && now - Date.parse(value) >= -ONLINE_WINDOW_MS);
}

function planIdValue(value: unknown): PlanId {
  return normalizePlanId(String(value || "medio"));
}

function latestPaymentData(data: FirestoreData[]) {
  return [...data].sort((left, right) => {
    const leftTime = Date.parse(String(left.paidAt || left.createdAt || "")) || 0;
    const rightTime = Date.parse(String(right.paidAt || right.createdAt || "")) || 0;
    return rightTime - leftTime;
  })[0];
}

export async function buildOrquestraPortalSnapshot() {
  const admin = firebaseAdmin();
  if (!admin) throw new Error("connector-firebase-not-configured");

  const generatedAt = new Date().toISOString();
  const now = Date.now();
  const tenantSnapshot = await admin.db.collection("tenants").get();
  const tenantDocs = [...tenantSnapshot.docs].sort((left, right) => String(left.data().name || "").localeCompare(String(right.data().name || ""), "pt-BR"));

  const clients = await Promise.all(tenantDocs.map(async (tenantDoc) => {
    const data = tenantDoc.data() as FirestoreData;
    const tenantId = tenantDoc.id;
    const [usersSnapshot, paymentsSnapshot] = await Promise.all([
      admin.db.collection(`tenants/${tenantId}/users`).get(),
      admin.db.collection(`platformPayments/${tenantId}/payments`).get(),
    ]);
    const users = usersSnapshot.docs.map((userDoc) => {
      const user = userDoc.data() as FirestoreData;
      const lastActivityAt = isoValue(user.lastActivityAt || user.lastSeenAt);
      return {
        id: userDoc.id,
        name: stringValue(user.name),
        email: stringValue(user.email),
        role: stringValue(user.role),
        lastActivityAt,
        lastAccessAt: isoValue(user.lastAccessAt),
        device: deviceValue(user),
      };
    });
    const onlineUserCount = users.filter((user) => isOnline(user.lastActivityAt, now)).length;
    const latestPayment = latestPaymentData(paymentsSnapshot.docs.map((paymentDoc) => paymentDoc.data() as FirestoreData));
    const planId = planIdValue(data.planId);
    const plan = getPlanRules(planId);
    const lastActivityAt = isoValue(data.lastActivityAt || data.lastSeenAt) || users.map((user) => user.lastActivityAt).filter(Boolean).sort().at(-1) || null;
    const updatedAt = isoValue(data.updatedAt) || lastActivityAt || generatedAt;

    return {
      id: tenantId,
      client: {
        id: tenantId,
        name: stringValue(data.name) || "Empresa",
        legalName: stringValue(data.legalName),
        tradeName: stringValue(data.tradeName),
        email: stringValue(data.contactEmail),
        phone: stringValue(data.contactPhone),
        document: {
          type: stringValue(data.documentType),
          number: stringValue(data.document),
        },
        address: {
          street: stringValue(data.address),
          number: stringValue(data.addressNumber),
          complement: stringValue(data.addressComplement),
          neighborhood: stringValue(data.neighborhood),
          city: stringValue(data.city),
          state: stringValue(data.state),
          cep: stringValue(data.cep),
          mapUrl: stringValue(data.mapUrl),
        },
      },
      responsible: {
        name: stringValue(data.contactName),
        email: stringValue(data.contactEmail),
        phone: stringValue(data.contactPhone),
      },
      subscription: {
        planId,
        planName: plan.label,
        monthlyFee: stringValue(data.monthlyFee) || plan.price,
        billingDay: stringValue(data.billingDay),
        renewalDate: dateValue(data.nextBillingDate),
        paymentMethod: stringValue(data.paymentMethod),
        billingStatus: stringValue(data.billingStatus),
        subscriptionStatus: stringValue(data.subscriptionStatus),
        paidPeriod: latestPayment ? {
          referenceMonth: stringValue(latestPayment.referenceMonth),
          amount: stringValue(latestPayment.amount),
          paidAt: dateValue(latestPayment.paidAt),
          nextBillingDate: dateValue(latestPayment.nextBillingDate),
          method: stringValue(latestPayment.method),
          providerId: stringValue(latestPayment.providerPaymentId || latestPayment.lastPaymentProviderId),
        } : null,
      },
      users,
      onlineUserCount,
      lastActivityAt,
      updatedAt,
    };
  }));

  const payload = {
    contractVersion: CONTRACT_VERSION,
    dataVersion: DATA_VERSION,
    sourceSystem: SOURCE_SYSTEM,
    generatedAt,
    updatedAt: generatedAt,
    clients,
  };
  const serializedPayload = JSON.stringify(payload);
  const summary: PortalSnapshotSyncSummary = {
    clientCount: clients.length,
    contractVersion: CONTRACT_VERSION,
    dataVersion: DATA_VERSION,
    generatedAt,
    onlineUserCount: clients.reduce((total, client) => total + client.onlineUserCount, 0),
    payloadBytes: Buffer.byteLength(serializedPayload, "utf8"),
    updatedAt: generatedAt,
    userCount: clients.reduce((total, client) => total + client.users.length, 0),
  };

  return { payload, serializedPayload, summary };
}

export function connectorEndpointIsValid(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || (url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname));
  } catch {
    return false;
  }
}
