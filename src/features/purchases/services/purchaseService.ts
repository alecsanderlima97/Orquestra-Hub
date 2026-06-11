import { addDoc, collection, serverTimestamp, writeBatch, doc, updateDoc } from "firebase/firestore";
import { db, firebaseReady } from "@/lib/firebase/config";
import { tenantCollectionPath } from "@/lib/firebase/paths";
import type { AccountPayable } from "@/features/accounts-payable/types/accountPayableTypes";
import type { Purchase } from "../types/purchaseTypes";

export async function createPurchaseWithAccounts(
  tenantId: string,
  purchase: Omit<Purchase, "id">,
  accounts: Omit<AccountPayable, "id">[],
) {
  if (!firebaseReady || !db) return null;
  const firestore = db;

  const purchaseRef = await addDoc(collection(firestore, tenantCollectionPath(tenantId, "purchases")), {
    ...purchase,
    createdAt: serverTimestamp(),
  });

  const batch = writeBatch(firestore);
  accounts.forEach((account) => {
    const accountRef = doc(collection(firestore, tenantCollectionPath(tenantId, "accountsPayable")));
    batch.set(accountRef, {
      ...account,
      purchaseId: purchaseRef.id,
      createdAt: serverTimestamp(),
    });
  });
  await batch.commit();
  return purchaseRef.id;
}

export async function updatePurchase(tenantId: string, purchaseId: string, purchase: Partial<Purchase>) {
  if (!firebaseReady || !db) return;
  await updateDoc(doc(db, tenantCollectionPath(tenantId, "purchases"), purchaseId), { ...purchase, updatedAt: serverTimestamp() });
}
