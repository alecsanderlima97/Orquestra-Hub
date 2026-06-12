import { createUserWithEmailAndPassword, EmailAuthProvider, GoogleAuthProvider, onAuthStateChanged, reauthenticateWithCredential, sendPasswordResetEmail, signInWithEmailAndPassword, signInWithPopup, signOut, updateProfile, type User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db, firebaseReady } from "@/lib/firebase/config";
import { tenantPath } from "@/lib/firebase/paths";
import { defaultTenantId } from "@/lib/tenant/tenant";
import type { AppUser } from "../types/authTypes";

export function mapFirebaseUser(user: User, role: AppUser["role"] = "Consulta"): AppUser {
  return {
    email: user.email || "",
    id: user.uid,
    name: user.displayName || user.email || "Usuario",
    role,
  };
}

async function mapUserWithRole(user: User) {
  if (!db) return mapFirebaseUser(user);
  const snapshot = await getDoc(doc(db, `${tenantPath(defaultTenantId)}/users/${user.uid}`));
  const role = snapshot.data()?.role as AppUser["role"] | undefined;
  return mapFirebaseUser(user, role || "Consulta");
}

export async function loginWithEmail(email: string, password: string) {
  if (!firebaseReady || !auth) return null;
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return mapUserWithRole(credential.user);
}

async function ensureTenantAccess(user: User) {
  if (!db) return;
  const reference = doc(db, `${tenantPath(defaultTenantId)}/users/${user.uid}`);
  const existing = await getDoc(reference);
  await setDoc(reference, { email: user.email || "", name: user.displayName || user.email || "Usuário", ...(existing.exists() ? {} : { role: "Consulta" }), updatedAt: serverTimestamp() }, { merge: true });
}

export async function registerWithEmail(name: string, email: string, password: string) {
  if (!firebaseReady || !auth) return null;
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName: name });
  await ensureTenantAccess(credential.user);
  return mapUserWithRole(credential.user);
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
