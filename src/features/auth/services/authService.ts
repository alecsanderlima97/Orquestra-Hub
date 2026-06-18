import { createUserWithEmailAndPassword, deleteUser, EmailAuthProvider, GoogleAuthProvider, onAuthStateChanged, reauthenticateWithCredential, signInWithEmailAndPassword, signInWithPopup, signInWithRedirect, signOut, updateProfile, type User } from "firebase/auth";
import { collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, setDoc } from "firebase/firestore";
import { consumeInvite, getInvite } from "@/features/users/services/inviteService";
import { auth, db, firebaseReady } from "@/lib/firebase/config";
import { tenantPath } from "@/lib/firebase/paths";
import { defaultTenantId } from "@/lib/tenant/tenant";
import type { AppUser, CompanyMembership } from "../types/authTypes";

const platformOwnerEmails = new Set(["limaalecsander@gmail.com"]);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function ownerRole(): AppUser["role"] {
  return "Proprietário";
}

export function mapFirebaseUser(user: User, role: AppUser["role"] = "Consulta", tenantId = defaultTenantId, companyName = "Orquestra Hub"): AppUser {
  const effectiveRole = platformOwnerEmails.has((user.email || "").toLowerCase()) || role === "Dono" ? ownerRole() : role;
  return {
    companyName,
    email: user.email || "",
    id: user.uid,
    name: user.displayName || user.email || "Usuário",
    role: effectiveRole,
    tenantId,
  };
}

function cacheUser(user: AppUser) {
  if (typeof window !== "undefined") window.localStorage.setItem("orquestra-user", JSON.stringify(user));
  return user;
}

async function mapUserWithRole(user: User, allowOnboarding = false) {
  if (!db) return mapFirebaseUser(user);
  const memberships = await getDocs(collection(db, `userTenants/${user.uid}/memberships`));
  if (!memberships.empty) {
    const membership = memberships.docs[0];
    const data = membership.data();
    const [access, tenant] = await Promise.all([
      getDoc(doc(db, `${tenantPath(membership.id)}/users/${user.uid}`)),
      getDoc(doc(db, tenantPath(membership.id))),
    ]);
    const role = platformOwnerEmails.has((user.email || "").toLowerCase()) || tenant.data()?.ownerId === user.uid
      ? ownerRole()
      : access.data()?.role || data.role || "Consulta";
    return mapFirebaseUser(user, role, membership.id, data.companyName || tenant.data()?.name || "Empresa");
  }

  if (allowOnboarding) return cacheUser({ ...mapFirebaseUser(user, ownerRole(), "", "Nova empresa"), needsOnboarding: true });
  const legacy = await getDoc(doc(db, `${tenantPath(defaultTenantId)}/users/${user.uid}`));
  if (legacy.exists()) return mapFirebaseUser(user, legacy.data().role || "Consulta", defaultTenantId, "Orquestra Hub");
  throw new Error("tenant-access-missing");
}

export async function loginWithEmail(email: string, password: string) {
  if (!firebaseReady || !auth) return null;
  const credential = await signInWithEmailAndPassword(auth, normalizeEmail(email), password);
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
  await setDoc(doc(db, tenantPath(tenantId)), { aiCredits: { balance: 5, included: 5, status: "Ativo", used: 0 }, createdAt: serverTimestamp(), name: companyName, ownerId: user.uid, status: "Ativo" });
  await setDoc(doc(db, `${tenantPath(tenantId)}/users/${user.uid}`), { createdAt: serverTimestamp(), email: user.email || "", name: user.displayName || user.email || "Usuário", role: ownerRole(), userId: user.uid });
  await setDoc(doc(db, `userTenants/${user.uid}/memberships/${tenantId}`), { companyName, createdAt: serverTimestamp(), role: ownerRole() });
}

export async function registerWithEmail(name: string, companyName: string, email: string, password: string, inviteCode = "", acceptedTerms = false) {
  if (!firebaseReady || !auth || !db) return null;
  const normalizedInviteCode = inviteCode.trim().toUpperCase();
  const normalizedEmail = normalizeEmail(email);
  const cleanPassword = password.trim();
  const finalName = name.trim();
  const finalCompanyName = companyName.trim();

  if (!finalName) throw new Error("name-required");
  if (!acceptedTerms) throw new Error("consent-required");
  if (!normalizedInviteCode && !finalCompanyName) throw new Error("company-required");
  if (!normalizedEmail) throw new Error("email-required");
  if (!emailPattern.test(normalizedEmail)) throw new Error("invalid-email");
  if (cleanPassword.length < 6) throw new Error("weak-password");

  const credential = await createUserWithEmailAndPassword(auth, normalizedEmail, cleanPassword);
  try {
    await updateProfile(credential.user, { displayName: finalName });
    const invite = await getInvite(normalizedInviteCode);
    if (normalizedInviteCode && !invite) throw new Error("invite-invalid");

    const tenantId = invite?.tenantId || crypto.randomUUID();
    const tenantName = invite?.companyName || finalCompanyName;
    const role: AppUser["role"] = invite?.role || ownerRole();

    if (!invite) await setDoc(doc(db, tenantPath(tenantId)), { aiCredits: { balance: 5, included: 5, status: "Ativo", used: 0 }, createdAt: serverTimestamp(), name: tenantName, ownerId: credential.user.uid, status: "Ativo" });
    try {
      await setDoc(doc(db, `${tenantPath(tenantId)}/users/${credential.user.uid}`), {
        consent: { acceptedAt: serverTimestamp(), privacyVersion: "2026-06-15", termsVersion: "2026-06-15" },
        createdAt: serverTimestamp(),
        email: normalizedEmail,
        inviteCode: normalizedInviteCode,
        name: finalName,
        role,
        userId: credential.user.uid,
      });
      await setDoc(doc(db, `userTenants/${credential.user.uid}/memberships/${tenantId}`), { companyName: tenantName, createdAt: serverTimestamp(), role });
      if (invite) await consumeInvite(normalizedInviteCode, credential.user.uid);
    } catch (error) {
      if (!invite) await deleteDoc(doc(db, tenantPath(tenantId))).catch(() => undefined);
      throw error;
    }
    return cacheUser(mapFirebaseUser(credential.user, role, tenantId, tenantName));
  } catch (error) {
    await deleteUser(credential.user).catch(() => undefined);
    throw error;
  }
}

export async function loginWithGoogle() {
  if (!firebaseReady || !auth) return null;
  const activeAuth = auth;
  const provider = new GoogleAuthProvider();
  const credential = await signInWithPopup(activeAuth, provider).catch(async (error) => {
    const code = String((error as { code?: string })?.code || "");
    if (
      code.includes("popup-blocked")
      || code.includes("popup-closed-by-user")
      || code.includes("cancelled-popup-request")
      || code.includes("web-storage-unsupported")
      || code.includes("internal-error")
    ) {
      await signInWithRedirect(activeAuth, provider);
      return null;
    }
    throw error;
  });
  if (!credential) return null;
  return mapUserWithRole(credential.user, true);
}

export async function completeGoogleOnboarding(user: AppUser, companyName: string) {
  if (!db || !auth?.currentUser) return user;
  const tenantId = user.tenantId || crypto.randomUUID();
  const finalCompanyName = companyName.trim() || "Meu Negócio";
  await setDoc(doc(db, tenantPath(tenantId)), { name: finalCompanyName, ownerId: user.id, status: "Ativo", updatedAt: serverTimestamp() }, { merge: true });
  await setDoc(doc(db, `${tenantPath(tenantId)}/users/${user.id}`), { consent: { acceptedAt: serverTimestamp(), privacyVersion: "2026-06-15", termsVersion: "2026-06-15" }, email: user.email, name: user.name, role: ownerRole(), updatedAt: serverTimestamp(), userId: user.id }, { merge: true });
  await setDoc(doc(db, `userTenants/${user.id}/memberships/${tenantId}`), { companyName: finalCompanyName, role: ownerRole(), updatedAt: serverTimestamp() }, { merge: true });
  return cacheUser({ ...user, companyName: finalCompanyName, needsOnboarding: false, role: ownerRole(), tenantId });
}

export async function resetPassword(email: string) {
  const response = await fetch("/api/auth/password-reset", { body: JSON.stringify({ email: normalizeEmail(email) }), headers: { "Content-Type": "application/json" }, method: "POST" });
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
    void mapUserWithRole(user, true)
      .then((mapped) => callback(cacheUser(mapped)))
      .catch(() => {
        window.localStorage.removeItem("orquestra-user");
        callback(null);
      });
  }, () => callback(null));
}

export async function listUserCompanies(userId: string): Promise<CompanyMembership[]> {
  if (!db || !firebaseReady || userId === "demo-user") return [];
  const firestore = db;
  const snapshot = await getDocs(collection(firestore, `userTenants/${userId}/memberships`));
  const currentEmail = auth?.currentUser?.email?.toLowerCase() || "";
  return Promise.all(snapshot.docs.map(async (membership) => {
    const [access, tenant] = await Promise.all([
      getDoc(doc(firestore, `${tenantPath(membership.id)}/users/${userId}`)),
      getDoc(doc(firestore, tenantPath(membership.id))),
    ]);
    const role = platformOwnerEmails.has(currentEmail) || tenant.data()?.ownerId === userId ? ownerRole() : access.data()?.role || membership.data().role || "Consulta";
    return { companyName: membership.data().companyName || tenant.data()?.name || "Empresa", role: role === "Dono" ? ownerRole() : role, tenantId: membership.id };
  }));
}
