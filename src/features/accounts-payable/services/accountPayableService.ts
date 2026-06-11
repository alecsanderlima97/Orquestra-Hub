import { addDoc, collection, doc, getDocs, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore";
import { db, firebaseReady } from "@/lib/firebase/config";
import { tenantCollectionPath } from "@/lib/firebase/paths";
import type { AccountPayable } from "../types/accountPayableTypes";

const collectionName = "accountsPayable";

export async function listAccountsPayable(tenantId: string): Promise<AccountPayable[]> {
  if (!firebaseReady || !db) return [];
  const snapshot = await getDocs(query(collection(db, tenantCollectionPath(tenantId, collectionName)), orderBy("dueDate")));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as AccountPayable);
}

export async function markAccountAsPaid(tenantId: string, accountId: string) {
  if (!firebaseReady || !db) return;
  await updateDoc(doc(db, tenantCollectionPath(tenantId, collectionName), accountId), {
    paidAt: serverTimestamp(),
    status: "Pago",
    updatedAt: serverTimestamp(),
  });
}

export async function updateAccountPayable(tenantId: string, accountId: string, account: Partial<AccountPayable>) {
  if (!firebaseReady || !db) return;
  await updateDoc(doc(db, tenantCollectionPath(tenantId, collectionName), accountId), { ...account, updatedAt: serverTimestamp() });
}

export async function createAccountPayable(tenantId: string, account: Omit<AccountPayable, "id">) {
  if (!firebaseReady || !db) return null;
  return addDoc(collection(db, tenantCollectionPath(tenantId, collectionName)), { ...account, createdAt: serverTimestamp() });
}
