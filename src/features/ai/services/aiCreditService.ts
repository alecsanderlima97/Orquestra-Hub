import { doc, getDoc } from "firebase/firestore";
import { db, firebaseReady } from "@/lib/firebase/config";
import { tenantPath } from "@/lib/firebase/paths";

export type AiCreditBalance = {
  balance: number;
  included: number;
  status: string;
  used: number;
};

export async function getAiCreditBalance(tenantId: string): Promise<AiCreditBalance> {
  if (!firebaseReady || !db || !tenantId) return { balance: 20, included: 20, status: "Ativo", used: 0 };
  const snapshot = await getDoc(doc(db, tenantPath(tenantId)));
  const aiCredits = snapshot.data()?.aiCredits || {};
  return {
    balance: Number.isFinite(Number(aiCredits.balance)) ? Number(aiCredits.balance) : 20,
    included: Number(aiCredits.included || 20),
    status: String(aiCredits.status || "Ativo"),
    used: Number(aiCredits.used || 0),
  };
}
