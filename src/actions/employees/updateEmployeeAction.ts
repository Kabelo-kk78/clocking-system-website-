"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { updateEmployeeSchema } from "@/lib/validation/employeeSchemas";
import { updateEmployee } from "@/services/employees/updateEmployee";

export async function updateEmployeeAction(input: unknown) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, PERMISSIONS.employees)) {
    throw new Error("Unauthorized");
  }

  const parsed = updateEmployeeSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    await updateEmployee(parsed.data);
  } catch (error) {
    return { success: false, message: (error as Error).message };
  }

  revalidatePath("/admin/employees");
  return { success: true, message: "Employee updated." };
}