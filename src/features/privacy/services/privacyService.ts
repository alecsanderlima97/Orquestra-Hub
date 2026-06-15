import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db, firebaseReady } from "@/lib/firebase/config";
import { tenantCollectionPath } from "@/lib/firebase/paths";
import type { AppUser } from "@/features/auth/types/authTypes";

export async function requestAccountDeletion(user: AppUser, reason: string) {
  const protocol = `LGPD-${Date.now().toString(36).toUpperCase()}`;
  if (!firebaseReady || !db || user.id === "demo-user") return protocol;
  await addDoc(collection(db, tenantCollectionPath(user.tenantId, "privacyRequests")), { createdAt: serverTimestamp(), email: user.email, protocol, reason: reason.trim(), status: "Recebida", type: "Exclusão de conta", userId: user.id });
  return protocol;
}
