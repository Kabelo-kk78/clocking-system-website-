"use server";

import { auth } from "@/lib/auth";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { qrTokenSchema } from "@/lib/validation/qrCodeSchemas";
import { getQrCodeView } from "@/services/qr/getQrCodeView";

export async function viewQrCodeAction(input: unknown) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, PERMISSIONS.qrCodes)) {
    throw new Error("Unauthorized");
  }

  const parsed = qrTokenSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Invalid QR code token." };

  const view = await getQrCodeView(parsed.data.token);
  if (!view) return { ok: false, message: "QR code not found." };

  return { ok: true, data: view };
}