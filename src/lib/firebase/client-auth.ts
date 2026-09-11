import { getAuth, type Auth } from "firebase/auth";
import { getFirebaseApp } from "./client";

let auth: Auth | undefined;

export function getClientAuth(): Auth {
  if (!auth) {
    auth = getAuth(getFirebaseApp());
  }
  return auth;
}
