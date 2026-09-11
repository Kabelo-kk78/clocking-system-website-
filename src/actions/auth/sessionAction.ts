"use server";

import { cookies } from "next/headers";
import { createSessionCookie, SESSION_COOKIE_NAME } from "@/lib/auth";

export async function exchangeTokenForSession(idToken: string) {
  if (!idToken) {
    return { success: false, message: "Missing authentication token." };
  }

  try {
    const sessionCookie = await createSessionCookie(idToken);
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 14,
    });
    return { success: true };
  } catch (error) {
    console.error("exchangeTokenForSession error:", error);
    return { success: false, message: "Could not create a session." };
  }
}

export async function signOutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
