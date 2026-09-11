import "server-only";
import { applicationDefault, cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function getCredentials() {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const encoded = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (encoded) {
    try {
      const parsed = JSON.parse(Buffer.from(encoded, "base64").toString("utf8"));
      return {
        credential: cert(parsed),
        projectId: (parsed.project_id as string) ?? projectId,
      };
    } catch {
      throw new Error("FIREBASE_SERVICE_ACCOUNT is not valid base64-encoded JSON.");
    }
  }

  return { credential: applicationDefault(), projectId };
}

let app: App | undefined;

export function getFirebaseAdminApp(): App {
  if (!app) {
    const { credential, projectId } = getCredentials();
    app = getApps()[0] ?? initializeApp({ credential, projectId });
  }
  return app;
}

export function getAdminAuth() {
  return getAuth(getFirebaseAdminApp());
}

export function getAdminFirestore() {
  return getFirestore(getFirebaseAdminApp());
}
