/**
 * Firebase Admin SDK singleton — SERVER ONLY.
 * Never import this file in client components or files prefixed "use client".
 *
 * Credentials are read from server-only env vars (no NEXT_PUBLIC_ prefix)
 * so they are never included in the browser bundle.
 */
import { initializeApp, cert, getApps, type App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

function initAdmin(): App {
  if (getApps().length > 0) {
    return getApps()[0]!;
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n"
  );

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing Firebase Admin credentials. " +
        "Ensure FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and " +
        "FIREBASE_ADMIN_PRIVATE_KEY are set in .env.local."
    );
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

const adminApp = initAdmin();

/** Firestore instance via the Admin SDK (server-side only). */
export const adminDb = getFirestore(adminApp);
/** Auth instance via the Admin SDK (server-side only). */
export const adminAuth = getAuth(adminApp);

export default adminApp;

