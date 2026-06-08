import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from "firebase/auth";
import { auth, firebaseReady } from "@/lib/firebase/config";
import type { AppUser } from "../types/authTypes";

export function mapFirebaseUser(user: User): AppUser {
  return {
    email: user.email || "",
    id: user.uid,
    name: user.displayName || user.email || "Usuario",
    role: "Dono",
  };
}

export async function loginWithEmail(email: string, password: string) {
  if (!firebaseReady || !auth) return null;
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return mapFirebaseUser(credential.user);
}

export async function logoutUser() {
  if (!firebaseReady || !auth) return;
  await signOut(auth);
}

export function listenAuth(callback: (user: AppUser | null) => void) {
  if (!firebaseReady || !auth) {
    callback(null);
    return () => undefined;
  }
  return onAuthStateChanged(auth, (user) => callback(user ? mapFirebaseUser(user) : null));
}
