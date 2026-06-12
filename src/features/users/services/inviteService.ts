import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { db, firebaseReady } from "@/lib/firebase/config";
import type { AppUser } from "@/features/auth/types/authTypes";

export async function createInvite(tenantId: string, companyName: string, role: AppUser["role"]) {
  if (!firebaseReady || !db) return "DEMO1234";
  const code = crypto.randomUUID().slice(0, 8).toUpperCase();
  await setDoc(doc(db, "invites", code), { code, companyName, role, tenantId, createdAt: serverTimestamp(), status: "Ativo" });
  return code;
}

export async function getInvite(code: string) {
  if (!firebaseReady || !db || !code) return null;
  const snapshot = await getDoc(doc(db, "invites", code.toUpperCase()));
  return snapshot.exists() ? snapshot.data() as { companyName: string; role: AppUser["role"]; tenantId: string } : null;
}
