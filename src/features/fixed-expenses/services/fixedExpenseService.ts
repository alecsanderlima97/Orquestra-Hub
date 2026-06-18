import { addDoc, collection, getDocs, orderBy, query, serverTimestamp } from "firebase/firestore";
import { db, firebaseReady } from "@/lib/firebase/config";
import { tenantCollectionPath } from "@/lib/firebase/paths";
import type { FixedExpense } from "../types/fixedExpenseTypes";
const collectionName = "fixedExpenses";
export async function listFixedExpenses(tenantId: string): Promise<FixedExpense[]> { if (!firebaseReady || !db) return []; const snapshot = await getDocs(query(collection(db, tenantCollectionPath(tenantId, collectionName)), orderBy("name"))); return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as FixedExpense); }
export async function createFixedExpense(tenantId: string, expense: Omit<FixedExpense, "id">) { if (!firebaseReady || !db) throw new Error("Firebase não está pronto para salvar a despesa fixa."); return addDoc(collection(db, tenantCollectionPath(tenantId, collectionName)), { ...expense, createdAt: serverTimestamp() }); }
