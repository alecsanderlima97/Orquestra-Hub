import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore";
import { db, firebaseReady } from "@/lib/firebase/config";
import { tenantCollectionPath } from "@/lib/firebase/paths";
import type { Supplier } from "../types/supplierTypes";

const collectionName = "suppliers";

export async function listSuppliers(tenantId: string): Promise<Supplier[]> {
  if (!firebaseReady || !db) return [];
  const snapshot = await getDocs(query(collection(db, tenantCollectionPath(tenantId, collectionName)), orderBy("name")));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Supplier);
}

export async function updateSupplier(tenantId: string, supplierId: string, supplier: Partial<Supplier>) {
  if (!firebaseReady || !db) return;
  await updateDoc(doc(db, tenantCollectionPath(tenantId, collectionName), supplierId), { ...supplier, updatedAt: serverTimestamp() });
}

export async function createSupplier(tenantId: string, supplier: Omit<Supplier, "id">) {
  if (!firebaseReady || !db) return null;
  return addDoc(collection(db, tenantCollectionPath(tenantId, collectionName)), {
    ...supplier,
    createdAt: serverTimestamp(),
  });
}

export async function deleteSupplier(tenantId: string, supplierId: string) {
  if (!firebaseReady || !db) return;
  await deleteDoc(doc(db, tenantCollectionPath(tenantId, collectionName), supplierId));
}
