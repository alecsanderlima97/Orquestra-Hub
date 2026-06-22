import { addDoc, collection, getDocs, orderBy, query, serverTimestamp } from "firebase/firestore";
import { db, firebaseReady } from "@/lib/firebase/config";
import { tenantCollectionPath } from "@/lib/firebase/paths";
import type { FinancialCategory } from "../types/financialCategoryTypes";

const collectionName = "financialCategories";

export async function listFinancialCategories(tenantId: string): Promise<FinancialCategory[]> {
  if (!firebaseReady || !db) return [];
  const snapshot = await getDocs(query(collection(db, tenantCollectionPath(tenantId, collectionName)), orderBy("name")));
  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as FinancialCategory);
}

export async function createFinancialCategory(tenantId: string, category: Omit<FinancialCategory, "id">) {
  if (!firebaseReady || !db) throw new Error("Firebase não está pronto para salvar a categoria.");
  return addDoc(collection(db, tenantCollectionPath(tenantId, collectionName)), { ...category, createdAt: serverTimestamp() });
}
