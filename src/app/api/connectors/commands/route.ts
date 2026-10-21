import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAiCreditPackage } from "@/features/ai/aiCreditPackages";
import { currentRenewalMonth, getPlanRules } from "@/features/plans/planRules";
import { firebaseAdmin } from "@/lib/firebase/admin";

export const runtime = "nodejs";

const SOURCE_SYSTEM = "orquestra_portal";
const TARGET_SYSTEM = "orquestra_hub";
const subscriptionStatuses = new Set(["trial", "ativo", "pausado", "vencido", "bloqueado", "cancelado"]);

function safeText(value: unknown, maxLength: number) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function secretMatches(received: string, expected: string) {
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);
  return receivedBuffer.length === expectedBuffer.length && timingSafeEqual(receivedBuffer, expectedBuffer);
}

function tenantIdCandidates(externalTenantId: string) {
  const candidates = [externalTenantId];
  if (externalTenantId.startsWith("orquestra_hub_")) candidates.push(externalTenantId.slice("orquestra_hub_".length));
  return [...new Set(candidates.filter(Boolean))];
}

function contractPlanId(value: unknown) {
  const normalized = safeText(value, 80).toLowerCase();
  if (normalized === "inicial" || normalized.includes("plano inicial")) return "inicial" as const;
  if (normalized === "premium" || normalized.includes("plano premium")) return "premium" as const;
  if (normalized === "medio" || normalized.includes("profissional") || normalized.includes("plano médio") || normalized.includes("plano medio")) return "medio" as const;
  return null;
}

function contractDate(value: unknown) {
  const normalized = safeText(value, 30);
  return normalized && /^\d{4}-\d{2}-\d{2}(?:T|$)/.test(normalized) ? normalized.slice(0, 10) : null;
}

export async function POST(request: Request) {
  const expectedSecret = process.env.ORQUESTRA_CONNECTOR_SHARED_SECRET?.trim() || "";
  const receivedSecret = request.headers.get("x-orquestra-connector-secret") || request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  if (!expectedSecret || !receivedSecret || !secretMatches(receivedSecret, expectedSecret)) return NextResponse.json({ error: "Conector não autorizado." }, { status: 401 });

  try {
    const body = await request.json() as Record<string, unknown>;
    const commandId = safeText(body.commandId, 160);
    const sourceSystem = safeText(body.sourceSystem, 80);
    const targetSystem = safeText(body.targetSystem, 80);
    const commandType = safeText(body.commandType, 80);
    const externalTenantId = safeText(body.externalTenantId, 160);
    const contract = body.contract && typeof body.contract === "object" ? body.contract as Record<string, unknown> : null;

    if (commandType === "tenant.updated") {
      if (!commandId || !/^[a-zA-Z0-9._:-]+$/.test(commandId) || sourceSystem !== SOURCE_SYSTEM || targetSystem !== TARGET_SYSTEM || !externalTenantId || !contract) {
        return NextResponse.json({ error: "Comando contratual inválido." }, { status: 400 });
      }

      const admin = firebaseAdmin();
      if (!admin) return NextResponse.json({ error: "Banco do sistema não está configurado." }, { status: 503 });

      let tenantId = "";
      for (const candidateId of tenantIdCandidates(externalTenantId)) {
        const candidateRef = admin.db.doc(`tenants/${candidateId}`);
        const candidate = await candidateRef.get();
        if (!candidate.exists) continue;
        const data = candidate.data() || {};
        if (candidateId === externalTenantId || data.externalCustomerId === externalTenantId) {
          tenantId = candidateId;
          break;
        }
      }
      if (!tenantId) {
        const query = await admin.db.collection("tenants").where("externalCustomerId", "==", externalTenantId).limit(1).get();
        tenantId = query.docs[0]?.id || "";
      }
      if (!tenantId) return NextResponse.json({ error: "Empresa de origem não encontrada." }, { status: 404 });

      const planId = contractPlanId(contract.plan);
      const monthlyFeeValue = contract.monthlyFee === null || contract.monthlyFee === undefined || contract.monthlyFee === ""
        ? null
        : Number(contract.monthlyFee);
      const billingDayValue = contract.billingDay === null || contract.billingDay === undefined || contract.billingDay === ""
        ? null
        : Number(contract.billingDay);
      const graceDaysValue = contract.graceDays === null || contract.graceDays === undefined || contract.graceDays === ""
        ? null
        : Number(contract.graceDays);
      const renewalDate = contractDate(contract.renewalDate || contract.nextDueDate);
      const startDate = contractDate(contract.startDate);
      const paymentMethod = safeText(contract.paymentMethod, 40);
      const subscriptionStatus = safeText(contract.subscriptionStatus, 30).toLowerCase();
      if (monthlyFeeValue !== null && (!Number.isFinite(monthlyFeeValue) || monthlyFeeValue < 0)) return NextResponse.json({ error: "Mensalidade inválida." }, { status: 400 });
      if (billingDayValue !== null && (!Number.isInteger(billingDayValue) || billingDayValue < 1 || billingDayValue > 31)) return NextResponse.json({ error: "Dia de vencimento inválido." }, { status: 400 });
      if (graceDaysValue !== null && (!Number.isInteger(graceDaysValue) || graceDaysValue < 0 || graceDaysValue > 60)) return NextResponse.json({ error: "Tolerância inválida." }, { status: 400 });
      if (contract.renewalDate !== undefined && !renewalDate) return NextResponse.json({ error: "Data de renovação inválida." }, { status: 400 });
      if (contract.startDate !== undefined && !startDate) return NextResponse.json({ error: "Data de início inválida." }, { status: 400 });
      if (subscriptionStatus && !subscriptionStatuses.has(subscriptionStatus)) return NextResponse.json({ error: "Status da assinatura inválido." }, { status: 400 });

      const commandRef = admin.db.collection("connectorCommands").doc(commandId);
      const tenantRef = admin.db.doc(`tenants/${tenantId}`);
      let duplicate = false;
      await admin.db.runTransaction(async (transaction) => {
        const [commandSnapshot, tenantSnapshot] = await Promise.all([transaction.get(commandRef), transaction.get(tenantRef)]);
        if (commandSnapshot.exists) {
          duplicate = true;
          return;
        }
        if (!tenantSnapshot.exists) throw new Error("Empresa de origem não encontrada.");
        const updates: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
        if (planId) updates.planId = planId;
        if (monthlyFeeValue !== null) updates.monthlyFee = monthlyFeeValue;
        if (billingDayValue !== null) updates.billingDay = String(billingDayValue);
        if (graceDaysValue !== null) updates.graceDays = graceDaysValue;
        if (startDate) updates.startDate = startDate;
        if (renewalDate) updates.nextBillingDate = renewalDate;
        if (paymentMethod) updates.paymentMethod = paymentMethod;
        if (subscriptionStatus) updates.subscriptionStatus = subscriptionStatus;
        transaction.update(tenantRef, updates);
        const now = new Date().toISOString();
        transaction.create(commandRef, {
          commandId,
          commandType,
          sourceSystem,
          targetSystem,
          externalTenantId,
          tenantId,
          status: "applied",
          fields: Object.keys(updates).filter((field) => field !== "updatedAt"),
          createdAt: now,
          appliedAt: now,
        });
        transaction.set(admin.db.doc(`tenants/${tenantId}/auditLogs/${commandId}`), {
          action: "tenant.contract_updated_from_portal",
          actorRole: "system",
          actorUserId: "orquestra_portal",
          createdAt: now,
          metadata: { fields: Object.keys(updates).filter((field) => field !== "updatedAt"), commandId },
          targetId: tenantId,
          targetType: "tenant",
        });
      });
      return NextResponse.json({ ok: true, duplicate, tenantId });
    }

    const grant = body.creditGrant && typeof body.creditGrant === "object" ? body.creditGrant as Record<string, unknown> : null;
    const packageId = safeText(grant?.packageId, 80);
    const creditPackage = getAiCreditPackage(packageId);
    const credits = Math.round(Number(grant?.credits));
    const amount = Number(grant?.amount);
    const paymentId = safeText(grant?.paymentId, 160);
    const purchaseId = safeText(grant?.purchaseId, 160);
    const expectedAmount = creditPackage ? Number(creditPackage.price.replace("R$", "").replace(".", "").replace(",", ".")) : 0;
    if (!commandId || !/^[a-zA-Z0-9._:-]+$/.test(commandId) || sourceSystem !== SOURCE_SYSTEM || targetSystem !== TARGET_SYSTEM || commandType !== "ai_credits.granted" || !externalTenantId || !creditPackage || credits !== creditPackage.credits || !Number.isFinite(amount) || Math.round(amount * 100) !== Math.round(expectedAmount * 100) || !paymentId || purchaseId !== commandId) {
      return NextResponse.json({ error: "Comando de créditos inválido." }, { status: 400 });
    }

    const admin = firebaseAdmin();
    if (!admin) return NextResponse.json({ error: "Banco do sistema não está configurado." }, { status: 503 });
    const commandRef = admin.db.collection("connectorCommands").doc(commandId);
    let duplicate = false;
    let appliedBalance = 0;
    let tenantId = "";
    for (const candidateId of tenantIdCandidates(externalTenantId)) {
      const candidateRef = admin.db.doc(`tenants/${candidateId}`);
      const candidate = await candidateRef.get();
      if (!candidate.exists) continue;
      const data = candidate.data() || {};
      if (candidateId === externalTenantId || data.externalCustomerId === externalTenantId) {
        tenantId = candidateId;
        break;
      }
    }
    if (!tenantId) {
      const query = await admin.db.collection("tenants").where("externalCustomerId", "==", externalTenantId).limit(1).get();
      tenantId = query.docs[0]?.id || "";
    }
    if (!tenantId) return NextResponse.json({ error: "Empresa de origem não encontrada." }, { status: 404 });

    const tenantRef = admin.db.doc(`tenants/${tenantId}`);
    const adjustmentRef = admin.db.doc(`tenants/${tenantId}/aiCreditAdjustments/${commandId}`);
    await admin.db.runTransaction(async (transaction) => {
      const [commandSnapshot, tenantSnapshot] = await Promise.all([transaction.get(commandRef), transaction.get(tenantRef)]);
      if (commandSnapshot.exists) {
        duplicate = true;
        appliedBalance = Number(commandSnapshot.data()?.balanceAfter || 0);
        return;
      }
      if (!tenantSnapshot.exists) throw new Error("Empresa de origem não encontrada.");
      const tenantData = tenantSnapshot.data() || {};
      const currentCredits = tenantData.aiCredits && typeof tenantData.aiCredits === "object" ? tenantData.aiCredits as Record<string, unknown> : {};
      const beforeBalance = Number.isFinite(Number(currentCredits.balance)) ? Number(currentCredits.balance) : 0;
      const beforeBonus = Number.isFinite(Number(currentCredits.bonus)) ? Number(currentCredits.bonus) : 0;
      const balanceAfter = beforeBalance + credits;
      appliedBalance = balanceAfter;
      const plan = getPlanRules(tenantData.planId);
      const now = new Date().toISOString();
      transaction.create(commandRef, {
        commandId,
        commandType,
        sourceSystem,
        targetSystem,
        externalTenantId,
        packageId,
        credits,
        amount,
        paymentId,
        purchaseId,
        tenantId,
        balanceBefore: beforeBalance,
        balanceAfter,
        status: "applied",
        createdAt: now,
        appliedAt: now,
      });
      transaction.set(adjustmentRef, {
        type: "purchase",
        source: "orquestra_portal",
        commandId,
        packageId,
        credits,
        amount,
        paymentId,
        balanceBefore: beforeBalance,
        balanceAfter,
        bonusBefore: beforeBonus,
        bonusAfter: beforeBonus + credits,
        createdAt: now,
        createdBy: "orquestra_portal",
      });
      transaction.update(tenantRef, {
        "aiCredits.balance": balanceAfter,
        "aiCredits.bonus": beforeBonus + credits,
        "aiCredits.included": plan.monthlyAiCredits,
        "aiCredits.lastAdjustmentAt": now,
        "aiCredits.lastAdjustmentBy": "orquestra_portal",
        "aiCredits.renewalMonth": String(currentCredits.renewalMonth || currentRenewalMonth()),
        "aiCredits.status": "Ativo",
        updatedAt: FieldValue.serverTimestamp(),
      });
      transaction.set(admin.db.doc(`tenants/${tenantId}/auditLogs/${commandId}`), {
        action: "ai_credits.purchase_applied",
        actorRole: "system",
        actorUserId: "orquestra_portal",
        createdAt: now,
        metadata: { packageId, credits, amount, paymentId, commandId },
        targetId: tenantId,
        targetType: "tenant",
      });
    });

    return NextResponse.json({ ok: true, duplicate, tenantId, balance: appliedBalance });
  } catch (error) {
    const code = (error as { code?: number | string }).code;
    if (code === 6 || code === "already-exists") return NextResponse.json({ ok: true, duplicate: true });
    console.error("orquestra_connector_command_failed", error instanceof Error ? error.message : "unknown-error");
    return NextResponse.json({ error: "Não foi possível aplicar o comando no sistema de origem." }, { status: 500 });
  }
}

