import { NextResponse } from "next/server";
import { createMercadoPagoPixPayment, mercadoPagoConfigured, mapMercadoPagoStatus } from "@/lib/billing/mercadoPago";
import { authorizeBillingTenant, billingCollection, dateInSaoPaulo, nextMonthDate, parseServerMoney, referenceMonth } from "@/lib/billing/billingServer";
import { getPlanRules } from "@/features/plans/planRules";

export const runtime = "nodejs";

function safeError(error: unknown) {
  const message = error instanceof Error ? error.message : "billing-failed";
  if (message === "mercado-pago-not-configured") return "O pagamento PIX ainda não está configurado para esta conta.";
  if (message.startsWith("mercado-pago-provider:")) return "O Mercado Pago recusou a cobrança. Verifique os dados cadastrais.";
  return "Não foi possível preparar a cobrança PIX agora.";
}

export async function POST(request: Request) {
  if (!mercadoPagoConfigured()) return NextResponse.json({ error: "O pagamento PIX ainda não está configurado para esta conta." }, { status: 503 });
  try {
    const body = await request.json().catch(() => ({}));
    const tenantId = String(body.tenantId || "").trim();
    const authorization = await authorizeBillingTenant(request, tenantId);
    if (!authorization) return NextResponse.json({ error: "Acesso negado para gerar esta cobrança." }, { status: 403 });

    const { admin, tenant, tenantId: authorizedTenantId, token, user } = authorization;
    const tenantData = tenant.data() || {};
    const amount = parseServerMoney(tenantData.monthlyFee) || parseServerMoney(getPlanRules(String(tenantData.planId)).price);
    if (amount <= 0) return NextResponse.json({ error: "O valor da mensalidade não está configurado." }, { status: 422 });

    const currentDate = dateInSaoPaulo();
    const nextBillingDate = nextMonthDate(currentDate);
    const currentReference = referenceMonth(currentDate);
    const currentChargeId = String(tenantData.billingCurrentChargeId || "");
    if (currentChargeId) {
      const currentCharge = await billingCollection(admin.db).doc(currentChargeId).get();
      const currentData = currentCharge.data();
      if (currentCharge.exists && currentData?.tenantId === authorizedTenantId && ["pending", "confirmed"].includes(String(currentData.status))) {
        return NextResponse.json({ charge: currentData });
      }
    }

    const payment = await createMercadoPagoPixPayment({
      amount: Number(amount.toFixed(2)),
      description: `Assinatura ${String(tenantData.name || "Orquestra Hub")} - ${currentReference}`,
      document: String(tenantData.document || "").replace(/\D/g, "") || undefined,
      documentType: String(tenantData.documentType || "CPF").toUpperCase(),
      email: String(tenantData.contactEmail || user.data()?.email || token.email || "cliente@orquestrahub.com").trim(),
      externalReference: `orquestra:${authorizedTenantId}:${currentReference}`,
    });
    const paymentId = String(payment.id);
    const transactionData = payment.point_of_interaction?.transaction_data || {};
    const charge = {
      amount: Number(amount.toFixed(2)),
      billingType: "PIX",
      createdAt: new Date(),
      dueDate: currentDate,
      externalReference: payment.external_reference || `orquestra:${authorizedTenantId}:${currentReference}`,
      id: paymentId,
      invoiceUrl: transactionData.ticket_url || "",
      mercadoPagoPaymentId: paymentId,
      nextBillingDate,
      pixEncodedImage: transactionData.qr_code_base64 || "",
      pixPayload: transactionData.qr_code || "",
      planId: tenantData.planId || "medio",
      provider: "mercadopago",
      referenceMonth: currentReference,
      providerStatus: payment.status || "pending",
      status: mapMercadoPagoStatus(payment.status),
      tenantId: authorizedTenantId,
      updatedAt: new Date(),
    };
    await billingCollection(admin.db).doc(paymentId).set(charge);
    await tenant.ref.update({ billingCurrentChargeId: paymentId, billingStatus: charge.status, updatedAt: new Date() });
    return NextResponse.json({ charge });
  } catch (error) {
    console.error("billing_pix_create_failed", error);
    return NextResponse.json({ error: safeError(error) }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const tenantId = url.searchParams.get("tenantId") || "";
    const authorization = await authorizeBillingTenant(request, tenantId);
    if (!authorization) return NextResponse.json({ error: "Acesso negado para consultar esta cobrança." }, { status: 403 });
    const chargeId = String(authorization.tenant.data()?.billingCurrentChargeId || "");
    if (!chargeId) return NextResponse.json({ charge: null });
    const charge = await billingCollection(authorization.admin.db).doc(chargeId).get();
    return NextResponse.json({ charge: charge.exists ? charge.data() : null });
  } catch (error) {
    console.error("billing_pix_status_failed", error);
    return NextResponse.json({ error: "Não foi possível consultar o status do pagamento." }, { status: 500 });
  }
}
