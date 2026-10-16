import { createHmac, timingSafeEqual, randomUUID } from "node:crypto";

type MercadoPagoErrorPayload = { cause?: Array<{ description?: string }>; message?: string };

export type MercadoPagoPayment = {
  date_approved?: string | null;
  date_created?: string;
  external_reference?: string;
  id: string | number;
  payer?: { email?: string };
  point_of_interaction?: { transaction_data?: { qr_code?: string; qr_code_base64?: string; ticket_url?: string } };
  status?: string;
  status_detail?: string;
  transaction_amount?: number;
};

export function mercadoPagoConfigured() {
  return Boolean(process.env.MERCADO_PAGO_ACCESS_TOKEN && process.env.MERCADO_PAGO_API_BASE_URL && process.env.MERCADO_PAGO_WEBHOOK_SECRET && process.env.MERCADO_PAGO_WEBHOOK_URL);
}

function mercadoPagoConfig() {
  const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
  const baseUrl = process.env.MERCADO_PAGO_API_BASE_URL?.replace(/\/$/, "");
  const notificationUrl = process.env.MERCADO_PAGO_WEBHOOK_URL;
  if (!accessToken || !baseUrl || !notificationUrl) throw new Error("mercado-pago-not-configured");
  return { accessToken, baseUrl, notificationUrl };
}

async function mercadoPagoRequest<T>(path: string, init: RequestInit = {}) {
  const { accessToken, baseUrl } = mercadoPagoConfig();
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
    cache: "no-store",
  });
  const body = await response.json().catch(() => null) as T & MercadoPagoErrorPayload | null;
  if (!response.ok) {
    const description = body && "cause" in body ? body.cause?.[0]?.description : body && "message" in body ? body.message : undefined;
    throw new Error(description ? `mercado-pago-provider:${description}` : `mercado-pago-provider-http-${response.status}`);
  }
  return body as T;
}

export function createMercadoPagoPixPayment(payload: { description: string; document?: string; documentType?: string; email: string; externalReference: string; amount: number }) {
  const { notificationUrl } = mercadoPagoConfig();
  const payer: { email: string; identification?: { number: string; type: string } } = { email: payload.email };
  if (payload.document) payer.identification = { number: payload.document, type: payload.documentType || "CPF" };
  return mercadoPagoRequest<MercadoPagoPayment>("/v1/payments", {
    body: JSON.stringify({
      description: payload.description,
      external_reference: payload.externalReference,
      notification_url: notificationUrl,
      payer,
      payment_method_id: "pix",
      transaction_amount: payload.amount,
    }),
    headers: { "X-Idempotency-Key": randomUUID() },
    method: "POST",
  });
}

export function getMercadoPagoPayment(paymentId: string) {
  return mercadoPagoRequest<MercadoPagoPayment>(`/v1/payments/${encodeURIComponent(paymentId)}`);
}

export function mercadoPagoWebhookSecret() {
  return process.env.MERCADO_PAGO_WEBHOOK_SECRET || "";
}

export function verifyMercadoPagoWebhookSignature({ dataId, requestId, signature }: { dataId: string; requestId: string; signature: string }) {
  const secret = mercadoPagoWebhookSecret();
  if (!secret || !signature || !dataId) return false;
  const values = new Map<string, string>();
  for (const item of signature.split(",")) {
    const [key, ...parts] = item.trim().split("=");
    if (key && parts.length) values.set(key, parts.join("="));
  }
  const timestamp = values.get("ts");
  const receivedHash = values.get("v1");
  if (!timestamp || !receivedHash) return false;
  const manifest = `id:${dataId};request-id:${requestId};ts:${timestamp};`;
  const expectedHash = createHmac("sha256", secret).update(manifest).digest("hex");
  const expectedBuffer = Buffer.from(expectedHash, "utf8");
  const receivedBuffer = Buffer.from(receivedHash, "utf8");
  return expectedBuffer.length === receivedBuffer.length && timingSafeEqual(expectedBuffer, receivedBuffer);
}

export function mapMercadoPagoStatus(status?: string) {
  if (status === "approved") return "paid";
  if (["pending", "in_process", "in_mediation"].includes(String(status))) return "pending";
  if (["refunded", "charged_back", "cancelled", "rejected", "expired"].includes(String(status))) return "reversed";
  return "pending";
}
