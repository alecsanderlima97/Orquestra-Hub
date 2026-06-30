import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
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
  if (!firebaseReady || !db) throw new Error("Firebase não está pronto para salvar a baixa.");
  await updateDoc(doc(db, tenantCollectionPath(tenantId, collectionName), accountId), {
    paidAt: serverTimestamp(),
    status: "Pago",
    updatedAt: serverTimestamp(),
  });
}

export async function updateAccountPayable(tenantId: string, accountId: string, account: Partial<AccountPayable>) {
  if (!firebaseReady || !db) throw new Error("Firebase não está pronto para atualizar a conta.");
  await updateDoc(doc(db, tenantCollectionPath(tenantId, collectionName), accountId), { ...account, updatedAt: serverTimestamp() });
}

export async function deleteAccountPayable(tenantId: string, accountId: string) {
  if (!firebaseReady || !db) throw new Error("Firebase não está pronto para excluir a conta.");
  await deleteDoc(doc(db, tenantCollectionPath(tenantId, collectionName), accountId));
}

export async function listAccountsByFixedExpense(tenantId: string, fixedExpenseId: string): Promise<AccountPayable[]> {
  if (!firebaseReady || !db) return [];
  const snapshot = await getDocs(query(collection(db, tenantCollectionPath(tenantId, collectionName)), where("fixedExpenseId", "==", fixedExpenseId)));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as AccountPayable);
}

export async function createAccountPayable(tenantId: string, account: Omit<AccountPayable, "id">) {
  if (!firebaseReady || !db) throw new Error("Firebase não está pronto para salvar a conta.");
  return addDoc(collection(db, tenantCollectionPath(tenantId, collectionName)), { ...account, createdAt: serverTimestamp() });
}
