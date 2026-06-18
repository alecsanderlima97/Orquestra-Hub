import { EmailAuthProvider, reauthenticateWithCredential, updatePassword, updateProfile } from "firebase/auth";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { auth, db, firebaseReady } from "@/lib/firebase/config";
import { tenantPath } from "@/lib/firebase/paths";
import type { AppUser } from "@/features/auth/types/authTypes";

export function currentLoginProvider() {
  return auth?.currentUser?.providerData.some((item) => item.providerId === "google.com") ? "google" : "password";
}

export async function updateUserProfile(user: AppUser, name: string, photoUrl: string) {
  if (!firebaseReady || !db || !auth?.currentUser) throw new Error("Banco de dados não conectado.");
  const finalName = name.trim();
  if (!finalName) throw new Error("Informe o nome do usuário.");
  await updateProfile(auth.currentUser, { displayName: finalName, photoURL: photoUrl || null }).catch(() => undefined);
  await updateDoc(doc(db, `${tenantPath(user.tenantId)}/users/${user.id}`), { name: finalName, photoUrl, updatedAt: serverTimestamp() });
  return { ...user, name: finalName, photoUrl };
}

export async function updateCompanyName(user: AppUser, companyName: string) {
  if (!firebaseReady || !db) throw new Error("Banco de dados não conectado.");
  const finalCompanyName = companyName.trim();
  if (!finalCompanyName) throw new Error("Informe o nome da empresa.");
  await updateDoc(doc(db, tenantPath(user.tenantId)), { name: finalCompanyName, updatedAt: serverTimestamp() });
  await updateDoc(doc(db, `userTenants/${user.id}/memberships/${user.tenantId}`), { companyName: finalCompanyName, updatedAt: serverTimestamp() });
  return { ...user, companyName: finalCompanyName };
}

export async function changePassword(currentPassword: string, nextPassword: string) {
  if (!auth?.currentUser?.email) throw new Error("Sessão inválida.");
  if (currentLoginProvider() === "google") throw new Error("Sua senha é gerenciada pela conta Google.");
  if (nextPassword.trim().length < 6) throw new Error("A nova senha deve ter pelo menos 6 caracteres.");
  const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword.trim());
  await reauthenticateWithCredential(auth.currentUser, credential);
  await updatePassword(auth.currentUser, nextPassword.trim());
}
