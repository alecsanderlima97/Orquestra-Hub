import { NextResponse } from "next/server";
import { getMercadoPagoPayment, mapMercadoPagoStatus, verifyMercadoPagoWebhookSignature } from "@/lib/billing/mercadoPago";
import { billingCollection } from "@/lib/billing/billingServer";
import { firebaseAdmin } from "@/lib/firebase/admin";

export const runtime = "nodejs";

function response(status = 200) {
  return NextResponse.json({ received: true }, { status });
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const dataId = url.searchParams.get("data.id") || "";
  const requestId = request.headers.get("x-request-id") || "";
  const signature = request.headers.get("x-signature") || "";
  if (!verifyMercadoPagoWebhookSignature({ dataId, requestId, signature })) return response(401);
  const admin = firebaseAdmin();
  if (!admin) return response(503);
  try {
    const body = await request.json() as { action?: string; data?: { id?: string | number }; id?: string | number; type?: string };
    if (body.type !== "payment") return response();
    const paymentId = String(body.data?.id || dataId).trim();
    const eventId = String(body.id || `${paymentId}:${body.action || "updated"}`).trim();
    if (!paymentId) return response();

    const eventRef = admin.db.doc(`billingWebhookEvents/mercadopago-${eventId}`);
    try {
      await eventRef.create({ createdAt: new Date(), event: body.action || "payment.updated", paymentId, provider: "mercadopago", status: "received" });
    } catch (error) {
      const alreadyExists = String((error as { code?: string | number })?.code || "") === "6" || String(error).includes("already-exists");
      if (!alreadyExists) throw error;
      const existingEvent = await eventRef.get();
      if (existingEvent.data()?.status === "processed") return response();
    }

    const chargeRef = billingCollection(admin.db).doc(paymentId);
    const chargeSnapshot = await chargeRef.get();
    if (!chargeSnapshot.exists) {
      await eventRef.update({ status: "ignored", reason: "charge-not-found", updatedAt: new Date() });
      return response();
    }
    const charge = chargeSnapshot.data() || {};
    const providerPayment = await getMercadoPagoPayment(paymentId);
    if (String(providerPayment.id) !== paymentId || String(providerPayment.external_reference || "") !== String(charge.externalReference || "")) {
      await eventRef.update({ status: "rejected", reason: "provider-data-mismatch", updatedAt: new Date() });
      return response(422);
    }
    const expectedAmount = Number(charge.amount || 0);
    if (Math.abs(Number(providerPayment.transaction_amount || 0) - expectedAmount) > 0.01) {
      await eventRef.update({ status: "rejected", reason: "amount-mismatch", updatedAt: new Date() });
      return response(422);
    }

    const tenantId = String(charge.tenantId || "");
    const tenantRef = admin.db.doc(`tenants/${tenantId}`);
    if (!tenantId || !(await tenantRef.get()).exists) {
      await eventRef.update({ status: "ignored", reason: "tenant-not-found", updatedAt: new Date() });
      return response();
    }
    const mappedStatus = mapMercadoPagoStatus(providerPayment.status);
    const paidAt = providerPayment.date_approved || new Date().toISOString().slice(0, 10);
    if (mappedStatus === "paid" && providerPayment.status === "approved") {
      await chargeRef.update({ paidAt, providerStatus: providerPayment.status, status: "paid", updatedAt: new Date() });
      await tenantRef.update({ billingCurrentChargeId: paymentId, billingStatus: "paid", lastPaymentAmount: expectedAmount, lastPaymentAt: paidAt, lastPaymentProviderId: paymentId, nextBillingDate: charge.nextBillingDate, subscriptionStatus: "ativo", updatedAt: new Date() });
      await admin.db.collection(`platformPayments/${tenantId}/payments`).doc(paymentId).set({ amount: expectedAmount, createdAt: new Date(), method: "PIX", nextBillingDate: charge.nextBillingDate, paidAt, planId: charge.planId || "medio", provider: "mercadopago", providerPaymentId: paymentId, referenceMonth: charge.referenceMonth, source: "webhook" }, { merge: true });
    } else {
      await chargeRef.update({ providerStatus: providerPayment.status || "pending", status: mappedStatus, updatedAt: new Date() });
      if (mappedStatus === "reversed" && ["refunded", "charged_back"].includes(String(providerPayment.status))) {
        await tenantRef.update({ billingStatus: "reversed", subscriptionStatus: "bloqueado", updatedAt: new Date() });
      }
    }
    await eventRef.update({ status: "processed", updatedAt: new Date() });
    return response();
  } catch (error) {
    console.error("mercado_pago_webhook_failed", error);
    return response(500);
  }
}
