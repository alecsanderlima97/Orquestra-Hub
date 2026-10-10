import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db, firebaseReady } from "@/lib/firebase/config";
import { tenantPath } from "@/lib/firebase/paths";

export type CompanySettings = {
  receiptRequiredOnPayment: boolean;
};

export const defaultCompanySettings: CompanySettings = {
  receiptRequiredOnPayment: false,
};

export async function getCompanySettings(tenantId: string): Promise<CompanySettings> {
  if (!firebaseReady || !db || !tenantId) return defaultCompanySettings;
  const snapshot = await getDoc(doc(db, tenantPath(tenantId)));
  if (!snapshot.exists()) return defaultCompanySettings;
  return {
    receiptRequiredOnPayment: snapshot.data().receiptRequiredOnPayment === true,
  };
}

export async function updateCompanySettings(tenantId: string, settings: CompanySettings) {
  if (!firebaseReady || !db) throw new Error("Firebase não está pronto para salvar as configurações.");
  await updateDoc(doc(db, tenantPath(tenantId)), {
    receiptRequiredOnPayment: settings.receiptRequiredOnPayment,
    updatedAt: serverTimestamp(),
  });
}
