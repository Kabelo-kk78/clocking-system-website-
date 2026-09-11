import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { firebaseConfig } from "./config";

let app: FirebaseApp | undefined;

export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    app = getApps()[0] ?? initializeApp(firebaseConfig);
  }
  return app;
}
