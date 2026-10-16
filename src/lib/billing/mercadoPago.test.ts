import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { mapMercadoPagoStatus, verifyMercadoPagoWebhookSignature } from "./mercadoPago";

const originalSecret = process.env.MERCADO_PAGO_WEBHOOK_SECRET;

afterEach(() => {
  if (originalSecret === undefined) delete process.env.MERCADO_PAGO_WEBHOOK_SECRET;
  else process.env.MERCADO_PAGO_WEBHOOK_SECRET = originalSecret;
});

describe("mercadoPago", () => {
  it("valida a assinatura HMAC do webhook", () => {
    const secret = "segredo-de-teste";
    const dataId = "123456";
    const requestId = "request-123";
    const timestamp = "1704908010";
    process.env.MERCADO_PAGO_WEBHOOK_SECRET = secret;
    const manifest = `id:${dataId};request-id:${requestId};ts:${timestamp};`;
    const hash = createHmac("sha256", secret).update(manifest).digest("hex");
    expect(verifyMercadoPagoWebhookSignature({ dataId, requestId, signature: `ts=${timestamp},v1=${hash}` })).toBe(true);
    expect(verifyMercadoPagoWebhookSignature({ dataId, requestId, signature: `ts=${timestamp},v1=${"0".repeat(hash.length)}` })).toBe(false);
  });

  it("mapeia os status do provedor para o financeiro", () => {
    expect(mapMercadoPagoStatus("approved")).toBe("paid");
    expect(mapMercadoPagoStatus("pending")).toBe("pending");
    expect(mapMercadoPagoStatus("refunded")).toBe("reversed");
  });
});
