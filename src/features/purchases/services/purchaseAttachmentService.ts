import type { PurchaseAttachment } from "../types/purchaseTypes";
import { auth } from "@/lib/firebase/config";

async function authHeaders() {
  const token = await auth?.currentUser?.getIdToken();
  if (!token) throw new Error("Sua sessão expirou. Entre novamente para gerenciar anexos.");
  return { Authorization: `Bearer ${token}` };
}

export async function uploadPurchaseAttachment(tenantId: string, purchaseId: string, category: "boletos" | "notas-fiscais" | "lojas" | "comprovantes", file: File): Promise<PurchaseAttachment> {
  const data = new FormData();
  data.append("tenantId", tenantId);
  data.append("purchaseId", purchaseId);
  data.append("category", category);
  data.append("file", file);
  const response = await fetch("/api/attachments", { body: data, headers: await authHeaders(), method: "POST" });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Não foi possível enviar o anexo.");
  return result as PurchaseAttachment;
}

export async function deletePurchaseAttachment(path?: string) {
  if (!path) throw new Error("Este anexo antigo não possui caminho para exclusão.");
  const response = await fetch("/api/attachments", { body: JSON.stringify({ path }), headers: { "Content-Type": "application/json", ...await authHeaders() }, method: "DELETE" });
  if (!response.ok) throw new Error("Não foi possível excluir o anexo.");
}
