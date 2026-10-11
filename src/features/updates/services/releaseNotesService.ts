import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db, firebaseReady } from "@/lib/firebase/config";
import { tenantCollectionPath } from "@/lib/firebase/paths";

const releaseStateField = "lastSeenReleaseId";

export async function getLastSeenReleaseId(tenantId: string, userId: string) {
  if (!firebaseReady || !db || !tenantId || !userId) return "";
  const snapshot = await getDoc(doc(db, tenantCollectionPath(tenantId, "users"), userId));
  return String(snapshot.data()?.[releaseStateField] || "");
}

export async function markReleaseAsSeen(tenantId: string, userId: string, releaseId: string) {
  if (!firebaseReady || !db || !tenantId || !userId || !releaseId) return;
  await updateDoc(doc(db, tenantCollectionPath(tenantId, "users"), userId), {
    lastSeenReleaseAt: serverTimestamp(),
    [releaseStateField]: releaseId,
  });
}
