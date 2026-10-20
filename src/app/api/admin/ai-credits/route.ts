import { NextResponse } from "next/server";
import { currentRenewalMonth, getPlanRules } from "@/features/plans/planRules";
import { firebaseAdmin } from "@/lib/firebase/admin";

export const runtime = "nodejs";

const platformAdminEmail = "orquestracs@gmail.com";

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Não foi possível adicionar os créditos IA.";
}

export async function POST(request: Request) {
  const admin = firebaseAdmin();
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!admin || !token) return NextResponse.json({ error: "Sessão administrativa inválida." }, { status: 401 });

  try {
    const decoded = await admin.auth.verifyIdToken(token);
    if (decoded.email?.trim().toLowerCase() !== platformAdminEmail) {
      return NextResponse.json({ error: "Apenas o Admin Orquestra.cs pode ajustar créditos." }, { status: 403 });
    }

    const body = await request.json();
    const tenantId = String(body.tenantId || "").trim();
    const credits = Number(body.credits);
    const reason = String(body.reason || "").trim();
    if (!tenantId) return NextResponse.json({ error: "Cliente obrigatório." }, { status: 400 });
    if (!Number.isInteger(credits) || credits < 1 || credits > 100000) {
      return NextResponse.json({ error: "Informe uma quantidade inteira entre 1 e 100.000 créditos." }, { status: 400 });
    }
    if (reason.length < 5 || reason.length > 300) {
      return NextResponse.json({ error: "Informe um motivo entre 5 e 300 caracteres." }, { status: 400 });
    }

    const tenantRef = admin.db.doc(`tenants/${tenantId}`);
    const adjustmentRef = admin.db.collection(`tenants/${tenantId}/aiCreditAdjustments`).doc();
    const result = await admin.db.runTransaction(async (transaction) => {
      const tenantSnapshot = await transaction.get(tenantRef);
      if (!tenantSnapshot.exists) throw new Error("Cliente não encontrado.");

      const data = tenantSnapshot.data() || {};
      const plan = getPlanRules(String(data.planId || "medio"));
      const storedCredits = data.aiCredits || {};
      const month = currentRenewalMonth();
      const bonusBefore = Math.max(Number(storedCredits.bonus || 0), 0);
      const shouldRenew = storedCredits.renewalMonth !== month;
      const balanceBefore = shouldRenew
        ? plan.monthlyAiCredits + bonusBefore
        : Number.isFinite(Number(storedCredits.balance)) ? Number(storedCredits.balance) : plan.initialAiCredits + bonusBefore;
      const used = shouldRenew ? 0 : Math.max(Number(storedCredits.used || 0), 0);
      const balanceAfter = balanceBefore + credits;
      const bonusAfter = bonusBefore + credits;
      const now = new Date();

      transaction.update(tenantRef, {
        "aiCredits.balance": balanceAfter,
        "aiCredits.bonus": bonusAfter,
        "aiCredits.included": plan.monthlyAiCredits,
        "aiCredits.renewalMonth": month,
        "aiCredits.status": "Ativo",
        "aiCredits.used": used,
        "aiCredits.lastAdjustmentAt": now.toISOString(),
        "aiCredits.lastAdjustmentBy": decoded.email,
        updatedAt: now,
      });
      transaction.create(adjustmentRef, {
        balanceAfter,
        balanceBefore,
        bonusAfter,
        bonusBefore,
        createdAt: now,
        createdBy: decoded.email,
        credits,
        reason,
        type: "manual_bonus",
      });

      return { balance: balanceAfter, bonus: bonusAfter, included: plan.monthlyAiCredits, used, adjustmentId: adjustmentRef.id };
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("admin_ai_credits_adjustment_failed", errorMessage(error));
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}
