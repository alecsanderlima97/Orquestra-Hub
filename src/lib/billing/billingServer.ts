import type { DecodedIdToken } from "firebase-admin/auth";
import type { DocumentSnapshot, Firestore } from "firebase-admin/firestore";
import { firebaseAdmin } from "@/lib/firebase/admin";

const billingRoles = new Set(["Proprietário", "Dono", "Financeiro"]);

export type BillingAuthorization = {
  admin: NonNullable<ReturnType<typeof firebaseAdmin>>;
  token: DecodedIdToken;
  tenant: DocumentSnapshot;
  tenantId: string;
  user: DocumentSnapshot;
};

export async function authorizeBillingTenant(request: Request, tenantId: string): Promise<BillingAuthorization | null> {
  const admin = firebaseAdmin();
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!admin || !bearer || !tenantId) return null;
  let token: DecodedIdToken;
  try {
    token = await admin.auth.verifyIdToken(bearer);
  } catch {
    return null;
  }
  const [tenant, user] = await Promise.all([
    admin.db.doc(`tenants/${tenantId}`).get(),
    admin.db.doc(`tenants/${tenantId}/users/${token.uid}`).get(),
  ]);
  if (!tenant.exists || !user.exists || !billingRoles.has(String(user.data()?.role || ""))) return null;
  return { admin, tenant, tenantId, token, user };
}

export function parseServerMoney(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const normalized = String(value || "").replace(/[^\d,.-]/g, "").replace(/\.(?=\d{3}(?:\D|$))/g, "").replace(",", ".");
  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : 0;
}

export function dateInSaoPaulo(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", { day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo", year: "numeric" }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function nextMonthDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  const next = new Date(year, month, 1);
  const lastDay = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(day, lastDay));
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}`;
}

export function referenceMonth(date: string) {
  const [year, month] = date.split("-");
  return `${month}/${year}`;
}

export function billingCollection(db: Firestore) {
  return db.collection("billingCharges");
}
