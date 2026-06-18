export type AuditAction = "criou" | "editou" | "pagou" | "anexou" | "excluiu";
export type AuditLog = { id: string; action: AuditAction; entity: string; entityId: string; userEmail: string; userId: string; userName?: string; createdAt?: { seconds: number } };
