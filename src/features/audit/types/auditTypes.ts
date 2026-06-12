export type AuditAction = "criou" | "editou" | "pagou" | "anexou";
export type AuditLog = { id: string; action: AuditAction; entity: string; entityId: string; userEmail: string; userId: string; createdAt?: { seconds: number } };
