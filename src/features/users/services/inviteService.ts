import { collection, doc, getDoc, getDocs, query, serverTimestamp, setDoc, Timestamp, updateDoc, where } from "firebase/firestore";
import { db, firebaseReady } from "@/lib/firebase/config";
import type { AppUser } from "@/features/auth/types/authTypes";
import { isInviteAvailable } from "../utils/accessRules";

export type Invite = {
  code: string;
  companyName: string;
  role: Exclude<AppUser["role"], "Dono">;
  tenantId: string;
  status: "Ativo" | "Usado" | "Cancelado" | "Expirado";
  expiresAt?: Timestamp;
  createdAt?: Timestamp;
  usedBy?: string;
};

export async function createInvite(tenantId: string, companyName: string, role: Invite["role"]) {
  if (!firebaseReady || !db) return { code: "DEMO1234", companyName, role, tenantId, status: "Ativo" as const };
  const code = crypto.randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase();
  const invite: Invite = { code, companyName, role, tenantId, status: "Ativo", expiresAt: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) };
  await setDoc(doc(db, "invites", code), { ...invite, createdAt: serverTimestamp() });
  return invite;
}

export async function listInvites(tenantId: string): Promise<Invite[]> {
  if (!firebaseReady || !db) return [];
  const snapshot = await getDocs(query(collection(db, "invites"), where("tenantId", "==", tenantId)));
  const now = Date.now();
  return snapshot.docs.map((item) => ({ ...item.data(), code: item.id }) as Invite).map((invite): Invite => invite.status === "Ativo" && invite.expiresAt && invite.expiresAt.toMillis() < now ? { ...invite, status: "Expirado" } : invite).sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
}

export async function cancelInvite(code: string) {
  if (!firebaseReady || !db) return;
  await updateDoc(doc(db, "invites", code), { status: "Cancelado", updatedAt: serverTimestamp() });
}

export async function getInvite(code: string): Promise<Invite | null> {
  if (!firebaseReady || !db || !code) return null;
  const snapshot = await getDoc(doc(db, "invites", code.toUpperCase()));
  if (!snapshot.exists()) return null;
  const invite = snapshot.data() as Invite;
  if (!isInviteAvailable(invite)) return null;
  return invite;
}

export async function consumeInvite(code: string, userId: string) {
  if (!firebaseReady || !db || !code) return;
  await updateDoc(doc(db, "invites", code), { status: "Usado", usedAt: serverTimestamp(), usedBy: userId });
}
