"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { checkInSchema } from "@/lib/validation/attendanceSchemas";
import { processCheckIn } from "@/services/attendance/processCheckIn";

export async function checkInAction(input: unknown) {
  const parsed = checkInSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Invalid check-in details." };
  }

  const result = await processCheckIn(parsed.data);
  return result;
}

export async function adminSendDailyCodesAction(date: string) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, PERMISSIONS.qrCodes)) {
    throw new Error("Unauthorized");
  }

  const { generateAndSendDailyQrCodes } = await import(
    "@/services/qr/generateAndSendDailyQrCodes"
  );
  const result = await generateAndSendDailyQrCodes(date);

  revalidatePath("/admin/attendance");
  revalidatePath("/admin");
  revalidatePath("/admin/qr-codes");
  return result;
}