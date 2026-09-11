"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { qrTokenSchema } from "@/lib/validation/qrCodeSchemas";
import { sendDailyQrEmail } from "@/services/email/sendDailyQrEmail";

export async function resendQrCodeAction(input: unknown) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, PERMISSIONS.qrCodes)) {
    throw new Error("Unauthorized");
  }

  const parsed = qrTokenSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Invalid QR code token." };

  const ok = await sendDailyQrEmail(parsed.data.token);

  revalidatePath("/admin/qr-codes");
  revalidatePath("/admin");

  return ok
    ? { ok, message: "QR code emailed again to the employee." }
    : { ok, message: "The email could not be sent for this code." };
}