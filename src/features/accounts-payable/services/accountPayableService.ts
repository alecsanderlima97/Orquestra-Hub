import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { db, firebaseReady } from "@/lib/firebase/config";
import { formatFirebaseDateTime } from "@/lib/formatters/br";
import { tenantCollectionPath } from "@/lib/firebase/paths";
import type { AccountPayable } from "../types/accountPayableTypes";

const collectionName = "accountsPayable";

function paymentUpdateError(error: unknown) {
  const code = (error as { code?: string })?.code || "erro-desconhecido";
  if (code === "permission-denied") return new Error("Permissão negada para registrar a baixa. O usuário precisa ter perfil Proprietário, Dono ou Financeiro. Detalhe: permission-denied.");
  if (code === "unauthenticated") return new Error("A sessão expirou. Entre novamente para registrar a baixa. Detalhe: unauthenticated.");
  if (code === "not-found") return new Error("Esta conta não foi encontrada no banco de dados. Atualize a tela antes de tentar novamente. Detalhe: not-found.");
  if (code === "unavailable" || code === "deadline-exceeded") return new Error(`Não foi possível conectar ao banco de dados agora. Verifique a internet e tente novamente. Detalhe: ${code}.`);
  return new Error(`Não foi possível registrar a baixa. Verifique a conexão e tente novamente. Detalhe: ${code}.`);
}

export async function listAccountsPayable(tenantId: string): Promise<AccountPayable[]> {
  if (!firebaseReady || !db) return [];
  const snapshot = await getDocs(query(collection(db, tenantCollectionPath(tenantId, collectionName)), orderBy("dueDate")));
  return snapshot.docs.map((item) => {
    const data = item.data();
    return { id: item.id, ...data, paidAt: formatFirebaseDateTime(data.paidAt) } as AccountPayable;
  });
}

export async function markAccountAsPaid(tenantId: string, accountId: string) {
  if (!firebaseReady || !db) throw new Error("Firebase não está pronto para salvar a baixa.");
  try {
    await updateDoc(doc(db, tenantCollectionPath(tenantId, collectionName), accountId), {
      paidAt: serverTimestamp(),
      status: "Pago",
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    throw paymentUpdateError(error);
  }
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
  return snapshot.docs.map((item) => {
    const data = item.data();
    return { id: item.id, ...data, paidAt: formatFirebaseDateTime(data.paidAt) } as AccountPayable;
  });
}

export async function createAccountPayable(tenantId: string, account: Omit<AccountPayable, "id">) {
  if (!firebaseReady || !db) throw new Error("Firebase não está pronto para salvar a conta.");
  return addDoc(collection(db, tenantCollectionPath(tenantId, collectionName)), { ...account, createdAt: serverTimestamp() });
}
