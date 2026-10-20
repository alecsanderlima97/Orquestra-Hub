import { doc, getDoc, updateDoc } from "firebase/firestore";
import { currentRenewalMonth, getPlanRules } from "@/features/plans/planRules";
import { db, firebaseReady } from "@/lib/firebase/config";
import { tenantPath } from "@/lib/firebase/paths";

export type AiCreditBalance = {
  balance: number;
  bonus: number;
  included: number;
  status: string;
  used: number;
};

export async function getAiCreditBalance(tenantId: string): Promise<AiCreditBalance> {
  if (!firebaseReady || !db || !tenantId) {
    const plan = getPlanRules();
    return { balance: plan.initialAiCredits, bonus: 0, included: plan.initialAiCredits, status: "Ativo", used: 0 };
  }
  const tenantRef = doc(db, tenantPath(tenantId));
  const snapshot = await getDoc(tenantRef);
  const plan = getPlanRules(snapshot.data()?.planId);
  const aiCredits = snapshot.data()?.aiCredits || {};
  const included = plan.monthlyAiCredits;
  const month = currentRenewalMonth();
  const bonus = Math.max(Number(aiCredits.bonus || 0), 0);
  const shouldRenew = aiCredits.renewalMonth !== month;
  const balance = shouldRenew ? included + bonus : Number.isFinite(Number(aiCredits.balance)) ? Number(aiCredits.balance) : plan.initialAiCredits + bonus;
  const used = shouldRenew ? 0 : Number(aiCredits.used || 0);
  if (shouldRenew) {
    await updateDoc(tenantRef, { "aiCredits.balance": balance, "aiCredits.bonus": bonus, "aiCredits.included": included, "aiCredits.renewalMonth": month, "aiCredits.used": 0 }).catch(() => undefined);
  }
  return {
    balance,
    bonus,
    included,
    status: String(aiCredits.status || "Ativo"),
    used,
  };
}
