"use server";

import { auth } from "@/lib/auth";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { testEmailSchema } from "@/lib/validation/qrCodeSchemas";
import { sendTestEmail } from "@/services/email/sendTestEmail";

export async function sendTestEmailAction(input: unknown) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, PERMISSIONS.qrCodes)) {
    throw new Error("Unauthorized");
  }

  const parsed = testEmailSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Enter a valid email address." };

  return sendTestEmail(parsed.data.to);
}