"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { updateEmployee } from "@/services/employees/updateEmployee";

export async function toggleEmployeeStatusAction(userId: string, isActive: boolean) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, PERMISSIONS.employees)) {
    throw new Error("Unauthorized");
  }

  await updateEmployee({ id: userId, isActive });
  revalidatePath("/admin/employees");
  return { success: true };
}