import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { firebaseReady, storage } from "@/lib/firebase/config";
import type { PurchaseAttachment } from "../types/purchaseTypes";

function safeFileName(name: string) {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]/g, "-");
}

export async function uploadPurchaseAttachment(tenantId: string, purchaseId: string, category: "boletos" | "notas-fiscais", file: File): Promise<PurchaseAttachment> {
  if (!firebaseReady || !storage) return { name: file.name, size: file.size, type: file.type, url: URL.createObjectURL(file) };
  const fileRef = ref(storage, `tenants/${tenantId}/purchases/${purchaseId}/${category}/${crypto.randomUUID()}-${safeFileName(file.name)}`);
  await uploadBytes(fileRef, file, { contentType: file.type });
  return { name: file.name, size: file.size, type: file.type, url: await getDownloadURL(fileRef) };
}
