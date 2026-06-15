import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

function clean(value?: string) {
  value = value?.trim() || "";
  return value.replace(/^['"]|['"]$/g, "");
}

const firebaseConfig = {
  apiKey: clean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
  appId: clean(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
  authDomain: clean(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
  messagingSenderId: clean(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
  projectId: clean(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
  storageBucket: clean(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
};

export const firebaseReady = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);

export const firebaseApp = firebaseReady
  ? getApps().length
    ? getApps()[0]
    : initializeApp(firebaseConfig)
  : null;

export const auth = firebaseApp ? getAuth(firebaseApp) : null;
export const db = firebaseApp ? initializeFirestore(firebaseApp, { experimentalAutoDetectLongPolling: true }) : null;
export const storage = firebaseApp ? getStorage(firebaseApp) : null;
