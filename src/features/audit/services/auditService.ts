import { addDoc, collection, getDocs, limit, orderBy, query, serverTimestamp } from "firebase/firestore";
import { db, firebaseReady } from "@/lib/firebase/config";
import { tenantCollectionPath } from "@/lib/firebase/paths";
import type { AppUser } from "@/features/auth/types/authTypes";
import type { AuditAction, AuditLog } from "../types/auditTypes";
export async function recordAudit(tenantId: string, user: AppUser | null, action: AuditAction, entity: string, entityId: string) { if (!firebaseReady || !db || !user || user.id === "demo-user") return; await addDoc(collection(db, tenantCollectionPath(tenantId, "auditLogs")), { action, entity, entityId, userEmail: user.email, userId: user.id, userName: user.name, createdAt: serverTimestamp() }); }
export async function listAuditLogs(tenantId: string): Promise<AuditLog[]> { if (!firebaseReady || !db) return []; const snap = await getDocs(query(collection(db, tenantCollectionPath(tenantId, "auditLogs")), orderBy("createdAt", "desc"), limit(50))); return snap.docs.map((item) => ({ id: item.id, ...item.data() }) as AuditLog); }
