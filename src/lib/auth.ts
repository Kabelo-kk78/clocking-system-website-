import "server-only";
import { cookies } from "next/headers";
import { getAdminAuth, getFirebaseAdminApp } from "@/lib/firebase/admin";
import { findUserByUid } from "@/lib/firestore/users";
import type { UserRole } from "@/lib/firestore/types";

export const SESSION_COOKIE_NAME = "attendance-session";

export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  fullName: string;
  isActive: boolean;
}

export interface AppSession {
  user: AppUser;
}

export async function auth(): Promise<AppSession | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) return null;

  try {
    const decoded = await getAdminAuth().verifySessionCookie(sessionCookie, true);
    const profile = await findUserByUid(decoded.uid);
    if (!profile || !profile.isActive) return null;
    if (profile.email !== decoded.email) return null;

    return {
      user: {
        id: decoded.uid,
        email: profile.email,
        name: profile.fullName,
        role: profile.role,
        fullName: profile.fullName,
        isActive: profile.isActive,
      },
    };
  } catch {
    return null;
  }
}

export async function createSessionCookie(idToken: string): Promise<string> {
  const expiresIn = 60 * 60 * 24 * 14 * 1000;
  return getAdminAuth().createSessionCookie(idToken, { expiresIn });
}

export function activeSessionApp(): boolean {
  return Boolean(getFirebaseAdminApp());
}
