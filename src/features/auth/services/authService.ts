import { browserLocalPersistence, createUserWithEmailAndPassword, deleteUser, EmailAuthProvider, GoogleAuthProvider, onAuthStateChanged, reauthenticateWithCredential, setPersistence, signInWithEmailAndPassword, signInWithPopup, signInWithRedirect, signOut, updateProfile, type User } from "firebase/auth";
import { collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { defaultPlanId, getPlanRules, normalizePlanId } from "@/features/plans/planRules";
import { consumeInvite, getInvite, type Invite } from "@/features/users/services/inviteService";
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

function inviteCreatesCompany(invite: Invite) {
  return invite.inviteType === "commercial" || !invite.tenantId;
}

function renewalMonth() {
  return new Date().toISOString().slice(0, 7);
}

function tenantPayload(name: string, ownerId: string, invite: Invite) {
  const plan = getPlanRules(invite.planId || defaultPlanId);
  return {
    aiCredits: { balance: plan.initialAiCredits, included: plan.initialAiCredits, renewalMonth: renewalMonth(), status: "Ativo", used: 0 },
    createdAt: serverTimestamp(),
    firstBillingDate: invite.nextBillingDate || "",
    name,
    nextBillingDate: invite.nextBillingDate || "",
    ownerId,
    planId: plan.id,
    status: "Ativo",
    subscriptionStatus: invite.subscriptionStatus || "trial",
  };
}

function firebaseStepError(step: string, error: unknown) {
  const detail = (error as { code?: string; message?: string })?.code || (error as { message?: string })?.message || String(error);
  return new Error(`${step}. Detalhe: ${detail}`);
}

async function runFirebaseStep<T>(step: string, action: () => Promise<T>) {
  try {
    return await action();
  } catch (error) {
    throw firebaseStepError(step, error);
  }
}

async function registerTenantAccess(tenantId: string) {
  if (!db || !tenantId) return;
  await updateDoc(doc(db, tenantPath(tenantId)), { lastAccessAt: serverTimestamp(), lastSeenAt: serverTimestamp() }).catch(() => undefined);
}

export async function touchTenantPresence(tenantId: string) {
  if (!db || !tenantId || tenantId === defaultTenantId) return;
  await updateDoc(doc(db, tenantPath(tenantId)), { lastSeenAt: serverTimestamp() }).catch(() => undefined);
}

export function mapFirebaseUser(user: User, role: AppUser["role"] = "Consulta", tenantId = defaultTenantId, companyName = "Orquestra Hub", planId = defaultPlanId, subscriptionStatus: AppUser["subscriptionStatus"] = "ativo", nextBillingDate = ""): AppUser {
  const effectiveRole = platformOwnerEmails.has((user.email || "").toLowerCase()) || role === "Dono" ? ownerRole() : role;
  return {
    companyName,
    email: user.email || "",
    id: user.uid,
    name: user.displayName || user.email || "Usuário",
    nextBillingDate,
    photoUrl: user.photoURL || "",
    planId: normalizePlanId(planId),
    role: effectiveRole,
    subscriptionStatus,
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
    const mapped = {
      ...mapFirebaseUser(user, role, membership.id, data.companyName || tenant.data()?.name || "Empresa", tenant.data()?.planId, tenant.data()?.subscriptionStatus || "ativo", tenant.data()?.nextBillingDate || ""),
      name: access.data()?.name || user.displayName || user.email || "Usuário",
      photoUrl: access.data()?.photoUrl || user.photoURL || "",
    };
    await registerTenantAccess(membership.id);
    return mapped;
  }

  if (allowOnboarding) return cacheUser({ ...mapFirebaseUser(user, ownerRole(), "", "Nova empresa"), needsOnboarding: true });
  const legacy = await getDoc(doc(db, `${tenantPath(defaultTenantId)}/users/${user.uid}`));
  if (legacy.exists()) return { ...mapFirebaseUser(user, legacy.data().role || "Consulta", defaultTenantId, "Orquestra Hub"), name: legacy.data().name || user.displayName || user.email || "Usuário", photoUrl: legacy.data().photoUrl || user.photoURL || "" };
  throw new Error("tenant-access-missing");
}

export async function loginWithEmail(email: string, password: string) {
  if (!firebaseReady || !auth) return null;
  await setPersistence(auth, browserLocalPersistence);
  const credential = await signInWithEmailAndPassword(auth, normalizeEmail(email), password);
  return mapUserWithRole(credential.user);
}

export async function registerWithEmail(name: string, companyName: string, email: string, password: string, inviteCode = "", acceptedTerms = false) {
  if (!firebaseReady || !auth || !db) return null;
  const firestore = db;
  await setPersistence(auth, browserLocalPersistence);
  const normalizedInviteCode = inviteCode.trim().toUpperCase();
  const normalizedEmail = normalizeEmail(email);
  const cleanPassword = password.trim();
  const finalName = name.trim();
  const finalCompanyName = companyName.trim();

  if (!finalName) throw new Error("name-required");
  if (!acceptedTerms) throw new Error("consent-required");
  if (!normalizedInviteCode) throw new Error("invite-required");
  if (!finalCompanyName) throw new Error("company-required");
  if (!normalizedEmail) throw new Error("email-required");
  if (!emailPattern.test(normalizedEmail)) throw new Error("invalid-email");
  if (cleanPassword.length < 6) throw new Error("weak-password");

  const invite = await runFirebaseStep("Falha ao validar convite", () => getInvite(normalizedInviteCode));
  if (!invite) throw new Error("invite-invalid");

  const createsCompany = inviteCreatesCompany(invite);
  const plan = getPlanRules(invite.planId || defaultPlanId);
  const tenantId = createsCompany ? crypto.randomUUID() : invite.tenantId;
  if (!tenantId) throw new Error("invite-invalid");
  const tenantName = createsCompany ? finalCompanyName : invite.companyName || finalCompanyName;
  const role: AppUser["role"] = createsCompany ? ownerRole() : invite.role;
  const subscriptionStatus = invite.subscriptionStatus || "trial";

  const credential = await createUserWithEmailAndPassword(auth, normalizedEmail, cleanPassword);
  try {
    await updateProfile(credential.user, { displayName: finalName });
    if (createsCompany) await runFirebaseStep("Falha ao criar empresa", () => setDoc(doc(firestore, tenantPath(tenantId)), tenantPayload(tenantName, credential.user.uid, invite)));
    try {
      await runFirebaseStep("Falha ao criar usuário da empresa", () => setDoc(doc(firestore, `${tenantPath(tenantId)}/users/${credential.user.uid}`), {
        consent: { acceptedAt: serverTimestamp(), privacyVersion: "2026-06-15", termsVersion: "2026-06-15" },
        createdAt: serverTimestamp(),
        email: normalizedEmail,
        inviteCode: normalizedInviteCode,
        name: finalName,
        role,
        userId: credential.user.uid,
      }));
      await runFirebaseStep("Falha ao vincular usuário à empresa", () => setDoc(doc(firestore, `userTenants/${credential.user.uid}/memberships/${tenantId}`), { companyName: tenantName, createdAt: serverTimestamp(), inviteCode: normalizedInviteCode, role }));
      await runFirebaseStep("Falha ao marcar convite como usado", () => consumeInvite(normalizedInviteCode, credential.user.uid));
    } catch (error) {
      if (createsCompany) await deleteDoc(doc(firestore, tenantPath(tenantId))).catch(() => undefined);
      throw error;
    }
    return cacheUser(mapFirebaseUser(credential.user, role, tenantId, tenantName, plan.id, subscriptionStatus, invite.nextBillingDate || ""));
  } catch (error) {
    await deleteUser(credential.user).catch(() => undefined);
    throw error;
  }
}

export async function loginWithGoogle() {
  if (!firebaseReady || !auth) return null;
  const activeAuth = auth;
  await setPersistence(activeAuth, browserLocalPersistence);
  const provider = new GoogleAuthProvider();
  const credential = await signInWithPopup(activeAuth, provider).catch(async (error) => {
    const code = String((error as { code?: string })?.code || "");
    if (code.includes("popup-blocked") || code.includes("popup-closed-by-user") || code.includes("cancelled-popup-request") || code.includes("web-storage-unsupported") || code.includes("internal-error")) {
      await signInWithRedirect(activeAuth, provider);
      return null;
    }
    throw error;
  });
  if (!credential) return null;
  return mapUserWithRole(credential.user, true);
}

export async function completeGoogleOnboarding(user: AppUser, companyName: string, userName: string, inviteCode: string) {
  if (!db || !auth?.currentUser) return user;
  const firestore = db;
  const finalCompanyName = companyName.trim();
  const finalUserName = userName.trim();
  const normalizedInviteCode = inviteCode.trim().toUpperCase();
  const invite = await runFirebaseStep("Falha ao validar convite", () => getInvite(normalizedInviteCode));
  if (!finalCompanyName || !finalUserName || !invite) throw new Error("onboarding-required");

  const createsCompany = inviteCreatesCompany(invite);
  const plan = getPlanRules(invite.planId || defaultPlanId);
  const tenantId = createsCompany ? crypto.randomUUID() : invite.tenantId;
  if (!tenantId) throw new Error("onboarding-required");
  const tenantName = createsCompany ? finalCompanyName : invite.companyName || finalCompanyName;
  const role: AppUser["role"] = createsCompany ? ownerRole() : invite.role;
  const subscriptionStatus = invite.subscriptionStatus || "trial";

  await updateProfile(auth.currentUser, { displayName: finalUserName }).catch(() => undefined);
  if (createsCompany) await runFirebaseStep("Falha ao criar empresa", () => setDoc(doc(firestore, tenantPath(tenantId)), tenantPayload(tenantName, user.id, invite), { merge: true }));
  await runFirebaseStep("Falha ao criar usuário da empresa", () => setDoc(doc(firestore, `${tenantPath(tenantId)}/users/${user.id}`), { consent: { acceptedAt: serverTimestamp(), privacyVersion: "2026-06-15", termsVersion: "2026-06-15" }, email: user.email, inviteCode: normalizedInviteCode, name: finalUserName, role, updatedAt: serverTimestamp(), userId: user.id }, { merge: true }));
  await runFirebaseStep("Falha ao vincular usuário à empresa", () => setDoc(doc(firestore, `userTenants/${user.id}/memberships/${tenantId}`), { companyName: tenantName, inviteCode: normalizedInviteCode, role, updatedAt: serverTimestamp() }, { merge: true }));
  await runFirebaseStep("Falha ao marcar convite como usado", () => consumeInvite(normalizedInviteCode, user.id));
  return cacheUser({ ...user, companyName: tenantName, name: finalUserName, needsOnboarding: false, nextBillingDate: invite.nextBillingDate || "", planId: plan.id, role, subscriptionStatus, tenantId });
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
    return { companyName: membership.data().companyName || tenant.data()?.name || "Empresa", nextBillingDate: tenant.data()?.nextBillingDate || "", planId: normalizePlanId(tenant.data()?.planId), role: role === "Dono" ? ownerRole() : role, subscriptionStatus: tenant.data()?.subscriptionStatus || "ativo", tenantId: membership.id };
  }));
}
