import { createUserWithEmailAndPassword, deleteUser, EmailAuthProvider, GoogleAuthProvider, onAuthStateChanged, reauthenticateWithCredential, signInWithEmailAndPassword, signInWithPopup, signOut, updateProfile, type User } from "firebase/auth";
import { collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db, firebaseReady } from "@/lib/firebase/config";
import { tenantPath } from "@/lib/firebase/paths";
import { defaultTenantId } from "@/lib/tenant/tenant";
import type { AppUser, CompanyMembership } from "../types/authTypes";
import { consumeInvite, getInvite } from "@/features/users/services/inviteService";

const platformOwnerEmails = new Set(["limaalecsander@gmail.com"]);

export function mapFirebaseUser(user: User, role: AppUser["role"] = "Consulta", tenantId = defaultTenantId, companyName = "Orquestra Hub"): AppUser {
  const effectiveRole = platformOwnerEmails.has((user.email || "").toLowerCase()) ? "Proprietário" : role === "Dono" ? "Proprietário" : role;
  return {
    email: user.email || "",
    id: user.uid,
    name: user.displayName || user.email || "Usuario",
    role: effectiveRole,
    tenantId,
    companyName,
  };
}

function cacheUser(user: AppUser) {
  if (typeof window !== "undefined") window.localStorage.setItem("orquestra-user", JSON.stringify(user));
  return user;
}

function cachedUser(user: User) {
  if (typeof window === "undefined") return null;
  try {
    const cached = JSON.parse(window.localStorage.getItem("orquestra-user") || "null") as AppUser | null;
    if (cached?.id !== user.uid) return null;
    return platformOwnerEmails.has((user.email || "").toLowerCase()) || cached.role === "Dono" ? { ...cached, role: "Proprietário" as const } : cached;
  } catch { return null; }
}

async function mapUserWithRole(user: User) {
  if (!db) return mapFirebaseUser(user);
  const memberships = await getDocs(collection(db, `userTenants/${user.uid}/memberships`));
  if (!memberships.empty) { const membership = memberships.docs[0]; const data = membership.data(); const access = await getDoc(doc(db, `${tenantPath(membership.id)}/users/${user.uid}`)); const role = platformOwnerEmails.has((user.email || "").toLowerCase()) ? "Proprietário" : access.data()?.role || data.role || "Consulta"; return mapFirebaseUser(user, role, membership.id, data.companyName || "Empresa"); }
  const legacy = await getDoc(doc(db, `${tenantPath(defaultTenantId)}/users/${user.uid}`));
  if (legacy.exists()) return mapFirebaseUser(user, legacy.data().role || "Consulta", defaultTenantId, "Orquestra Hub");
  return mapFirebaseUser(user);
}

export async function loginWithEmail(email: string, password: string) {
  if (!firebaseReady || !auth) return null;
  const credential = await signInWithEmailAndPassword(auth, email, password);
  await ensureTenantAccess(credential.user);
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
  await setDoc(doc(db, `${tenantPath(tenantId)}/users/${user.uid}`), { email: user.email || "", name: user.displayName || user.email || "Usuário", role: "Proprietário", userId: user.uid, createdAt: serverTimestamp() });
  await setDoc(doc(db, `userTenants/${user.uid}/memberships/${tenantId}`), { companyName, role: "Proprietário", createdAt: serverTimestamp() });
}

export async function registerWithEmail(name: string, companyName: string, email: string, password: string, inviteCode = "", acceptedTerms = false) {
  if (!firebaseReady || !auth || !db) return null;
  const normalizedInviteCode = inviteCode.trim().toUpperCase();
  if (!name.trim()) throw new Error("name-required");
  if (!acceptedTerms) throw new Error("consent-required");
  if (!normalizedInviteCode && !companyName.trim()) throw new Error("company-required");
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  try {
    await updateProfile(credential.user, { displayName: name.trim() });
    const invite = await getInvite(normalizedInviteCode);
    if (normalizedInviteCode && !invite) throw new Error("invite-invalid");
    const tenantId = invite?.tenantId || crypto.randomUUID();
    const finalCompanyName = invite?.companyName || companyName.trim();
    const role: AppUser["role"] = invite?.role || "Proprietário";
    if (!invite) await setDoc(doc(db, tenantPath(tenantId)), { createdAt: serverTimestamp(), name: finalCompanyName, ownerId: credential.user.uid, status: "Ativo" });
    try {
      await setDoc(doc(db, `${tenantPath(tenantId)}/users/${credential.user.uid}`), { consent: { acceptedAt: serverTimestamp(), privacyVersion: "2026-06-15", termsVersion: "2026-06-15" }, email, inviteCode: normalizedInviteCode, name: name.trim(), role, userId: credential.user.uid, createdAt: serverTimestamp() });
      await setDoc(doc(db, `userTenants/${credential.user.uid}/memberships/${tenantId}`), { companyName: finalCompanyName, role, createdAt: serverTimestamp() });
      if (invite) await consumeInvite(normalizedInviteCode, credential.user.uid);
    } catch (error) {
      if (!invite) await deleteDoc(doc(db, tenantPath(tenantId))).catch(() => undefined);
      throw error;
    }
    return cacheUser(mapFirebaseUser(credential.user, role, tenantId, finalCompanyName));
  } catch (error) {
    await deleteUser(credential.user).catch(() => undefined);
    throw error;
  }
}

export async function loginWithGoogle() {
  if (!firebaseReady || !auth) return null;
  const credential = await signInWithPopup(auth, new GoogleAuthProvider());
  await ensureTenantAccess(credential.user);
  return mapUserWithRole(credential.user);
}

export async function resetPassword(email: string) {
  const response = await fetch("/api/auth/password-reset", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
  if (!response.ok) throw new Error((await response.json()).error || "reset-failed");
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
  return onAuthStateChanged(auth, (user) => {
    if (!user) {
      callback(null);
      return;
    }
    const timeout = new Promise<AppUser>((resolve) => {
      window.setTimeout(() => resolve(cachedUser(user) || mapFirebaseUser(user)), 8000);
    });
    void Promise.race([mapUserWithRole(user), timeout])
      .then((mapped) => callback(cacheUser(mapped)))
      .catch(() => callback(cachedUser(user) || mapFirebaseUser(user)));
  }, () => callback(null));
}

export async function listUserCompanies(userId: string): Promise<CompanyMembership[]> {
  if (!db || !firebaseReady || userId === "demo-user") return [];
  const firestore = db;
  const snapshot = await getDocs(collection(firestore, `userTenants/${userId}/memberships`));
  const currentEmail = auth?.currentUser?.email?.toLowerCase() || "";
  return Promise.all(snapshot.docs.map(async (membership) => { const access = await getDoc(doc(firestore, `${tenantPath(membership.id)}/users/${userId}`)); const role = platformOwnerEmails.has(currentEmail) ? "Proprietário" : access.data()?.role || membership.data().role || "Consulta"; return { companyName: membership.data().companyName || "Empresa", role: role === "Dono" ? "Proprietário" : role, tenantId: membership.id }; }));
}
