import type { FirebaseTimestampLike } from "@/lib/formatters/br";

export type AuditAction = "criou" | "editou" | "pagou" | "anexou" | "excluiu";
export type AuditDetails = {
  details?: string;
  metadata?: Record<string, string>;
};

export type AuditLog = {
  id: string;
  action: AuditAction;
  createdAt?: FirebaseTimestampLike;
  details?: string;
  entity: string;
  entityId: string;
  metadata?: Record<string, string>;
  userEmail: string;
  userId: string;
  userName?: string;
};
