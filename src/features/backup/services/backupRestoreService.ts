import { collection, doc, getDocs, serverTimestamp, writeBatch } from "firebase/firestore";
import { db, firebaseReady } from "@/lib/firebase/config";
import { tenantCollectionPath } from "@/lib/firebase/paths";

const restorableCollections = [
  ["stores", "stores"],
  ["suppliers", "suppliers"],
  ["purchases", "purchases"],
  ["accounts", "accountsPayable"],
  ["fixedExpenses", "fixedExpenses"],
  ["financialCategories", "financialCategories"],
] as const;

export type BackupRestoreMode = "add" | "replace";

export type BackupRestorePreview = {
  accounts: number;
  auditLogs: number;
  financialCategories: number;
  fixedExpenses: number;
  purchases: number;
  stores: number;
  suppliers: number;
};

export type BackupPayload = Partial<Record<"accounts" | "auditLogs" | "financialCategories" | "fixedExpenses" | "purchases" | "stores" | "suppliers", unknown>> & {
  exportedAt?: string;
  version?: number;
};

type RestorablePayloadKey = typeof restorableCollections[number][0];
type BackupIdMaps = Partial<Record<RestorablePayloadKey, Map<string, string>>>;

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

function itemId(item: Record<string, unknown>) {
  return typeof item.id === "string" && item.id.trim() ? item.id : null;
}

function newDocumentId() {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

function buildIdMaps(payload: BackupPayload, mode: BackupRestoreMode): BackupIdMaps {
  return restorableCollections.reduce<BackupIdMaps>((maps, [payloadKey]) => {
    const map = new Map<string, string>();
    asItems(payload[payloadKey]).forEach((item) => {
      const originalId = itemId(item);
      if (originalId) map.set(originalId, mode === "replace" ? originalId : newDocumentId());
    });
    maps[payloadKey] = map;
    return maps;
  }, {});
}

function remapReferences(item: Record<string, unknown>, payloadKey: RestorablePayloadKey, idMaps: BackupIdMaps) {
  const data = { ...item };
  if (payloadKey !== "accounts") return data;

  for (const field of ["categoryId", "fixedExpenseId"] as const) {
    const value = data[field];
    const map = field === "categoryId" ? idMaps.financialCategories : idMaps.fixedExpenses;
    if (typeof value === "string" && map?.has(value)) data[field] = map.get(value);
  }
  return data;
}

export function parseBackupPayload(raw: string): BackupPayload {
  const parsed = JSON.parse(raw) as BackupPayload;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Arquivo inválido.");
  return parsed;
}

export function previewBackupPayload(payload: BackupPayload): BackupRestorePreview {
  return {
    accounts: asItems(payload.accounts).length,
    auditLogs: asItems(payload.auditLogs).length,
    financialCategories: asItems(payload.financialCategories).length,
    fixedExpenses: asItems(payload.fixedExpenses).length,
    purchases: asItems(payload.purchases).length,
    stores: asItems(payload.stores).length,
    suppliers: asItems(payload.suppliers).length,
  };
}

export async function restoreBackup(tenantId: string, payload: BackupPayload, mode: BackupRestoreMode) {
  if (!firebaseReady || !db) throw new Error("Banco de dados não conectado.");

  const operations: Array<
    | { kind: "delete"; ref: ReturnType<typeof doc> }
    | { data: ReturnType<typeof cleanItem>; kind: "set"; ref: ReturnType<typeof doc> }
  > = [];
  const idMaps = buildIdMaps(payload, mode);

  if (mode === "replace") {
    for (const [, collectionName] of restorableCollections) {
      const snapshot = await getDocs(collection(db, tenantCollectionPath(tenantId, collectionName)));
      snapshot.docs.forEach((item) => operations.push({ kind: "delete", ref: item.ref }));
    }
  }

  for (const [payloadKey, collectionName] of restorableCollections) {
    for (const item of asItems(payload[payloadKey])) {
      const originalId = itemId(item);
      const targetId = (originalId && idMaps[payloadKey]?.get(originalId)) || newDocumentId();
      const ref = doc(collection(db, tenantCollectionPath(tenantId, collectionName)), targetId);
      operations.push({ data: cleanItem(remapReferences(item, payloadKey, idMaps)), kind: "set", ref });
    }
  }

  for (let offset = 0; offset < operations.length; offset += 400) {
    const batch = writeBatch(db);
    operations.slice(offset, offset + 400).forEach((operation) => {
      if (operation.kind === "delete") batch.delete(operation.ref);
      else batch.set(operation.ref, operation.data);
    });
    await batch.commit();
  }

  return previewBackupPayload(payload);
}
