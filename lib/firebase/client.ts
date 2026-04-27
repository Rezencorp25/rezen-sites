"use client";

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  connectAuthEmulator,
  type Auth,
} from "firebase/auth";
import {
  getFirestore,
  connectFirestoreEmulator,
  type Firestore,
} from "firebase/firestore";

const config = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "fake-for-emulator",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ??
    "rezen-sites-dev.firebaseapp.com",
  projectId:
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "rezen-sites-dev",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ??
    "rezen-sites-dev.appspot.com",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ??
    "000000000000",
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ??
    "1:000000000000:web:xxx",
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let emulatorsConnected = false;

export function getFirebase() {
  if (!getApps().length) {
    app = initializeApp(config);
  } else {
    app = getApps()[0]!;
  }

  auth = getAuth(app);
  db = getFirestore(app);

  if (
    typeof window !== "undefined" &&
    process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true" &&
    !emulatorsConnected
  ) {
    try {
      connectAuthEmulator(auth, "http://127.0.0.1:9099", {
        disableWarnings: true,
      });
      connectFirestoreEmulator(db, "127.0.0.1", 8080);
      emulatorsConnected = true;
    } catch {
      // Already connected (HMR): ignore.
    }
  }

  return { app, auth, db };
}
