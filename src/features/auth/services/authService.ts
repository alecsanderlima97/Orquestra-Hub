import { createUserWithEmailAndPassword, EmailAuthProvider, GoogleAuthProvider, onAuthStateChanged, reauthenticateWithCredential, sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup, signOut, updateProfile, type User } from "firebase/auth";
import { collection, doc, getDoc, getDocs, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db, firebaseReady } from "@/lib/firebase/config";
import { tenantPath } from "@/lib/firebase/paths";
import { defaultTenantId } from "@/lib/tenant/tenant";
import type { AppUser, CompanyMembership } from "../types/authTypes";
import { getInvite } from "@/features/users/services/inviteService";

export function mapFirebaseUser(user: User, role: AppUser["role"] = "Consulta", tenantId = defaultTenantId, companyName = "Orquestra Hub"): AppUser {
  return {
    email: user.email || "",
    id: user.uid,
    name: user.displayName || user.email || "Usuario",
    role,
    tenantId,
    companyName,
  };
}

async function mapUserWithRole(user: User) {
  if (!db) return mapFirebaseUser(user);
  const memberships = await getDocs(collection(db, `userTenants/${user.uid}/memberships`));
  if (!memberships.empty) { const membership = memberships.docs[0]; const data = membership.data(); const access = await getDoc(doc(db, `${tenantPath(membership.id)}/users/${user.uid}`)); return mapFirebaseUser(user, access.data()?.role || data.role || "Consulta", membership.id, data.companyName || "Empresa"); }
  const legacy = await getDoc(doc(db, `${tenantPath(defaultTenantId)}/users/${user.uid}`));
  if (legacy.exists()) return mapFirebaseUser(user, legacy.data().role || "Consulta", defaultTenantId, "Orquestra Hub");
  return mapFirebaseUser(user);
}

export async function loginWithEmail(email: string, password: string) {
  if (!firebaseReady || !auth) return null;
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return mapUserWithRole(credential.user);
}

async function ensureTenantAccess(user: User) {
  if (!db) return;
  const memberships = await getDocs(collection(db, `userTenants/${user.uid}/memberships`));
  if (!memberships.empty) return;
  const legacy = await getDoc(doc(db, `${tenantPath(defaultTenantId)}/users/${user.uid}`));
  if (legacy.exists()) return;
  const tenantId = crypto.randomUUID();
  const companyName = `Empresa de ${user.displayName || "Novo usuário"}`;
  await setDoc(doc(db, tenantPath(tenantId)), { createdAt: serverTimestamp(), name: companyName, ownerId: user.uid, status: "Ativo" });
  await setDoc(doc(db, `${tenantPath(tenantId)}/users/${user.uid}`), { email: user.email || "", name: user.displayName || user.email || "Usuário", role: "Dono", userId: user.uid, createdAt: serverTimestamp() });
  await setDoc(doc(db, `userTenants/${user.uid}/memberships/${tenantId}`), { companyName, role: "Dono", createdAt: serverTimestamp() });
}

export async function registerWithEmail(name: string, companyName: string, email: string, password: string, inviteCode = "") {
  if (!firebaseReady || !auth) return null;
  const normalizedInviteCode = inviteCode.trim().toUpperCase();
  const invite = await getInvite(normalizedInviteCode);
  if (normalizedInviteCode && !invite) throw new Error("invite-invalid");
  if (!name.trim()) throw new Error("name-required");
  if (!invite && !companyName.trim()) throw new Error("company-required");
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName: name.trim() });
  const tenantId = invite?.tenantId || crypto.randomUUID();
  const finalCompanyName = invite?.companyName || companyName.trim();
  const role: AppUser["role"] = invite?.role || "Dono";
  if (!invite) {
  await setDoc(doc(db!, tenantPath(tenantId)), { createdAt: serverTimestamp(), name: finalCompanyName, ownerId: credential.user.uid, status: "Ativo" });
  }
  await setDoc(doc(db!, `${tenantPath(tenantId)}/users/${credential.user.uid}`), { email, inviteCode: normalizedInviteCode, name: name.trim(), role, userId: credential.user.uid, createdAt: serverTimestamp() });
  await setDoc(doc(db!, `userTenants/${credential.user.uid}/memberships/${tenantId}`), { companyName: finalCompanyName, role, createdAt: serverTimestamp() });
  return mapFirebaseUser(credential.user, role, tenantId, finalCompanyName);
}

export async function loginWithGoogle() {
  if (!firebaseReady || !auth) return null;
  const credential = await signInWithPopup(auth, new GoogleAuthProvider());
  await ensureTenantAccess(credential.user);
  return mapUserWithRole(credential.user);
}

export async function resetPassword(email: string) {
  if (!firebaseReady || !auth) return;
  await sendPasswordResetEmail(auth, email);
}

export async function logoutUser() {
  if (!firebaseReady || !auth) return;
  await signOut(auth);
}

export async function verifyCurrentPassword(password: string) {
  if (!firebaseReady || !auth?.currentUser?.email) return password === "123456";
  const credential = EmailAuthProvider.credential(auth.currentUser.email, password);
  await reauthenticateWithCredential(auth.currentUser, credential);
  return true;
}

export function listenAuth(callback: (user: AppUser | null) => void) {
  if (!firebaseReady || !auth) {
    callback(null);
    return () => undefined;
  }
  return onAuthStateChanged(auth, (user) => { if (!user) callback(null); else void mapUserWithRole(user).then(callback); });
}

export async function listUserCompanies(userId: string): Promise<CompanyMembership[]> {
  if (!db || !firebaseReady || userId === "demo-user") return [];
  const firestore = db;
  const snapshot = await getDocs(collection(firestore, `userTenants/${userId}/memberships`));
  return Promise.all(snapshot.docs.map(async (membership) => { const access = await getDoc(doc(firestore, `${tenantPath(membership.id)}/users/${userId}`)); return { companyName: membership.data().companyName || "Empresa", role: access.data()?.role || membership.data().role || "Consulta", tenantId: membership.id }; }));
}
