import { collection, doc, getDocs, serverTimestamp, updateDoc } from "firebase/firestore";
import { db, firebaseReady } from "@/lib/firebase/config";
import { tenantCollectionPath } from "@/lib/firebase/paths";
import type { AppUser } from "@/features/auth/types/authTypes";

export async function listTenantUsers(tenantId: string, companyName = "Empresa"): Promise<AppUser[]> {
  if (!firebaseReady || !db) return [];
  const snap = await getDocs(collection(db, tenantCollectionPath(tenantId, "users")));
  return snap.docs.map((item) => ({
    companyName,
    tenantId,
    id: item.id,
    email: String(item.data().email || ""),
    name: String(item.data().name || item.data().email || "Usuário"),
    photoUrl: String(item.data().photoUrl || ""),
    role: (item.data().role || "Consulta") as AppUser["role"],
  }));
}

export async function updateTenantUserRole(tenantId: string, userId: string, role: AppUser["role"]) {
  if (!firebaseReady || !db) return;
  await updateDoc(doc(db, tenantCollectionPath(tenantId, "users"), userId), { role, updatedAt: serverTimestamp() });
}
