import { addDoc, collection, doc, getDocs, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore";
import { db, firebaseReady } from "@/lib/firebase/config";
import { tenantCollectionPath } from "@/lib/firebase/paths";
import type { Store } from "../types/storeTypes";

const collectionName = "stores";

export async function listStores(tenantId: string): Promise<Store[]> {
  if (!firebaseReady || !db) return [];
  const snapshot = await getDocs(query(collection(db, tenantCollectionPath(tenantId, collectionName)), orderBy("name")));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Store);
}

export async function updateStore(tenantId: string, storeId: string, store: Partial<Store>) {
  if (!firebaseReady || !db) return;
  await updateDoc(doc(db, tenantCollectionPath(tenantId, collectionName), storeId), { ...store, updatedAt: serverTimestamp() });
}

export async function createStore(tenantId: string, store: Omit<Store, "id">) {
  if (!firebaseReady || !db) return null;
  return addDoc(collection(db, tenantCollectionPath(tenantId, collectionName)), {
    ...store,
    createdAt: serverTimestamp(),
  });
}
