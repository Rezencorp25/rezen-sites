import {
  initializeApp,
  getApps,
  cert,
  applicationDefault,
  type App,
} from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

const PROJECT_ID =
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "rezen-sites-dev";

let adminApp: App | null = null;
let adminAuth: Auth | null = null;
let adminDb: Firestore | null = null;

function resolveCredentials() {
  const useEmulator = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true";
  if (useEmulator) {
    // Emulator: no credentials needed. Point env vars to emulator hosts.
    process.env.FIRESTORE_EMULATOR_HOST ??= "127.0.0.1:8080";
    process.env.FIREBASE_AUTH_EMULATOR_HOST ??= "127.0.0.1:9099";
    return undefined;
  }
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (json) {
    try {
      return cert(JSON.parse(json));
    } catch {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT_JSON is set but not valid JSON",
      );
    }
  }
  return applicationDefault();
}

export function getAdmin() {
  if (!adminApp) {
    if (getApps().length === 0) {
      adminApp = initializeApp({
        projectId: PROJECT_ID,
        credential: resolveCredentials(),
      });
    } else {
      adminApp = getApps()[0]!;
    }
    adminAuth = getAuth(adminApp);
    adminDb = getFirestore(adminApp);
  }
  return { app: adminApp, auth: adminAuth!, db: adminDb! };
}
