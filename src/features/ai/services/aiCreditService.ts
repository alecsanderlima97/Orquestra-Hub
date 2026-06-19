import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db, firebaseReady } from "@/lib/firebase/config";
import { tenantPath } from "@/lib/firebase/paths";

const INITIAL_AI_CREDITS = 8;

export type AiCreditBalance = {
  balance: number;
  included: number;
  status: string;
  used: number;
};

export async function getAiCreditBalance(tenantId: string): Promise<AiCreditBalance> {
  if (!firebaseReady || !db || !tenantId) return { balance: INITIAL_AI_CREDITS, included: INITIAL_AI_CREDITS, status: "Ativo", used: 0 };
  const tenantRef = doc(db, tenantPath(tenantId));
  const snapshot = await getDoc(tenantRef);
  const aiCredits = snapshot.data()?.aiCredits || {};
  const included = Number(aiCredits.included || INITIAL_AI_CREDITS);
  const bonus = Math.max(INITIAL_AI_CREDITS - included, 0);
  const balance = Number.isFinite(Number(aiCredits.balance)) ? Number(aiCredits.balance) + bonus : INITIAL_AI_CREDITS;
  if (bonus > 0) {
    await updateDoc(tenantRef, { "aiCredits.balance": balance, "aiCredits.included": INITIAL_AI_CREDITS }).catch(() => undefined);
  }
  return {
    balance,
    included: Math.max(included, INITIAL_AI_CREDITS),
    status: String(aiCredits.status || "Ativo"),
    used: Number(aiCredits.used || 0),
  };
}
