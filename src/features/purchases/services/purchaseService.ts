import { addDoc, collection, getDocs, serverTimestamp, writeBatch, doc, updateDoc } from "firebase/firestore";
import { db, firebaseReady } from "@/lib/firebase/config";
import { tenantCollectionPath } from "@/lib/firebase/paths";
import type { AccountPayable } from "@/features/accounts-payable/types/accountPayableTypes";
import type { Purchase } from "../types/purchaseTypes";

export async function createPurchaseWithAccounts(
  tenantId: string,
  purchase: Omit<Purchase, "id">,
  accounts: Omit<AccountPayable, "id">[],
) {
  if (!firebaseReady || !db) throw new Error("Firebase não está pronto para salvar a compra.");
  const firestore = db;

  const purchaseRef = await addDoc(collection(firestore, tenantCollectionPath(tenantId, "purchases")), {
    ...purchase,
    createdAt: serverTimestamp(),
  });

  const batch = writeBatch(firestore);
  const accountIds: string[] = [];
  accounts.forEach((account) => {
    const accountRef = doc(collection(firestore, tenantCollectionPath(tenantId, "accountsPayable")));
    accountIds.push(accountRef.id);
    batch.set(accountRef, {
      ...account,
      purchaseId: purchaseRef.id,
      createdAt: serverTimestamp(),
    });
  });
  await batch.commit();
  return { accountIds, purchaseId: purchaseRef.id };
}

export async function updatePurchase(tenantId: string, purchaseId: string, purchase: Partial<Purchase>) {
  if (!firebaseReady || !db) throw new Error("Firebase não está pronto para atualizar a compra.");
  await updateDoc(doc(db, tenantCollectionPath(tenantId, "purchases"), purchaseId), { ...purchase, updatedAt: serverTimestamp() });
}

export async function listPurchases(tenantId: string): Promise<Purchase[]> {
  if (!firebaseReady || !db) return [];
  const snapshot = await getDocs(collection(db, tenantCollectionPath(tenantId, "purchases")));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data(), description: String(item.data().description || "") }) as Purchase);
}
