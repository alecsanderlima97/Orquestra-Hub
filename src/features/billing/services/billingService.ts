import { auth } from "@/lib/firebase/config";

export type PixCharge = {
  amount: number;
  dueDate: string;
  id: string;
  invoiceUrl?: string;
  nextBillingDate: string;
  pixEncodedImage?: string;
  pixExpirationDate?: string;
  pixPayload?: string;
  referenceMonth: string;
  status: "confirmed" | "overdue" | "paid" | "pending" | "reversed" | string;
};

async function billingRequest(path: string, init: RequestInit = {}) {
  const token = await auth?.currentUser?.getIdToken();
  if (!token) throw new Error("Sessão expirada. Entre novamente para continuar.");
  const response = await fetch(path, { ...init, headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init.headers || {}) } });
  const body = await response.json().catch(() => ({})) as { charge?: PixCharge; error?: string };
  if (!response.ok) throw new Error(body.error || "Não foi possível consultar o pagamento.");
  return body;
}

export async function createPixCharge(tenantId: string) {
  const response = await billingRequest("/api/billing/pix", { body: JSON.stringify({ tenantId }), method: "POST" });
  return response.charge || null;
}

export async function getPixChargeStatus(tenantId: string) {
  const response = await billingRequest(`/api/billing/pix?tenantId=${encodeURIComponent(tenantId)}`);
  return response.charge || null;
}
