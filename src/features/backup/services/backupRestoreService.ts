import { collection, doc, getDocs, serverTimestamp, writeBatch } from "firebase/firestore";
import { db, firebaseReady } from "@/lib/firebase/config";
import { tenantCollectionPath } from "@/lib/firebase/paths";

const restorableCollections = [
  ["stores", "stores"],
  ["suppliers", "suppliers"],
  ["purchases", "purchases"],
  ["accounts", "accountsPayable"],
  ["fixedExpenses", "fixedExpenses"],
] as const;

export type BackupRestoreMode = "add" | "replace";

export type BackupRestorePreview = {
  accounts: number;
  fixedExpenses: number;
  purchases: number;
  stores: number;
  suppliers: number;
};

export type BackupPayload = Partial<Record<"accounts" | "fixedExpenses" | "purchases" | "stores" | "suppliers", unknown>> & {
  exportedAt?: string;
  version?: number;
};

function asItems(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object" && !Array.isArray(item));
}

function cleanItem(item: Record<string, unknown>) {
  const data = { ...item };
  delete data.id;
  delete data.createdAt;
  delete data.updatedAt;
  return { ...data, restoredAt: serverTimestamp() };
}

export function parseBackupPayload(raw: string): BackupPayload {
  const parsed = JSON.parse(raw) as BackupPayload;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Arquivo inválido.");
  return parsed;
}

export function previewBackupPayload(payload: BackupPayload): BackupRestorePreview {
  return {
    accounts: asItems(payload.accounts).length,
    fixedExpenses: asItems(payload.fixedExpenses).length,
    purchases: asItems(payload.purchases).length,
    stores: asItems(payload.stores).length,
    suppliers: asItems(payload.suppliers).length,
  };
}

export async function restoreBackup(tenantId: string, payload: BackupPayload, mode: BackupRestoreMode) {
  if (!firebaseReady || !db) throw new Error("Banco de dados não conectado.");

  const batch = writeBatch(db);

  if (mode === "replace") {
    for (const [, collectionName] of restorableCollections) {
      const snapshot = await getDocs(collection(db, tenantCollectionPath(tenantId, collectionName)));
      snapshot.docs.forEach((item) => batch.delete(item.ref));
    }
  }

  for (const [payloadKey, collectionName] of restorableCollections) {
    for (const item of asItems(payload[payloadKey])) {
      const ref = doc(collection(db, tenantCollectionPath(tenantId, collectionName)));
      batch.set(ref, cleanItem(item));
    }
  }

  await batch.commit();
  return previewBackupPayload(payload);
}
