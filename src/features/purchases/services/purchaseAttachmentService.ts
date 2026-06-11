import type { PurchaseAttachment } from "../types/purchaseTypes";

export async function uploadPurchaseAttachment(tenantId: string, purchaseId: string, category: "boletos" | "notas-fiscais", file: File): Promise<PurchaseAttachment> {
  const data = new FormData();
  data.append("tenantId", tenantId);
  data.append("purchaseId", purchaseId);
  data.append("category", category);
  data.append("file", file);
  const response = await fetch("/api/attachments", { body: data, method: "POST" });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Não foi possível enviar o anexo.");
  return result as PurchaseAttachment;
}
