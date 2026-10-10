import { addDoc, collection, getDocs, limit, orderBy, query, serverTimestamp } from "firebase/firestore";
import { db, firebaseReady } from "@/lib/firebase/config";
import { tenantCollectionPath } from "@/lib/firebase/paths";
import type { AppUser } from "@/features/auth/types/authTypes";
import type { AuditAction, AuditDetails, AuditLog } from "../types/auditTypes";

export async function recordAudit(tenantId: string, user: AppUser | null, action: AuditAction, entity: string, entityId: string, details?: AuditDetails) {
  if (!firebaseReady || !db || !user || user.id === "demo-user") return;

  const auditData: {
    action: AuditAction;
    createdAt: ReturnType<typeof serverTimestamp>;
    details?: string;
    entity: string;
    entityId: string;
    metadata?: Record<string, string>;
    userEmail: string;
    userId: string;
    userName?: string;
  } = {
    action,
    createdAt: serverTimestamp(),
    entity,
    entityId,
    userEmail: user.email,
    userId: user.id,
    userName: user.name,
  };

  if (details?.details) auditData.details = details.details;
  if (details?.metadata && Object.keys(details.metadata).length) auditData.metadata = details.metadata;
  await addDoc(collection(db, tenantCollectionPath(tenantId, "auditLogs")), auditData);
}

export async function listAuditLogs(tenantId: string): Promise<AuditLog[]> { if (!firebaseReady || !db) return []; const snap = await getDocs(query(collection(db, tenantCollectionPath(tenantId, "auditLogs")), orderBy("createdAt", "desc"), limit(50))); return snap.docs.map((item) => ({ id: item.id, ...item.data() }) as AuditLog); }
