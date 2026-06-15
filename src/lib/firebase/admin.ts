import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

export function firebaseAdmin() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  let parsed: unknown = JSON.parse(raw.trim());
  if (typeof parsed === "string") parsed = JSON.parse(parsed);
  const account = parsed as { client_email: string; private_key: string; project_id: string };
  const app = getApps()[0] || initializeApp({ credential: cert({ clientEmail: account.client_email, privateKey: account.private_key.replace(/\\n/g, "\n"), projectId: account.project_id }) });
  return { auth: getAuth(app), db: getFirestore(app) };
}

export async function authorizeTenant(request: Request, tenantId: string) {
  const admin = firebaseAdmin();
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!admin || !token || !tenantId) return false;
  const decoded = await admin.auth.verifyIdToken(token);
  return (await admin.db.doc(`tenants/${tenantId}/users/${decoded.uid}`).get()).exists;
}
