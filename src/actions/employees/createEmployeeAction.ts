"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { hasPermission, PERMISSIONS } from "@/lib/permissions";
import { createEmployeeSchema } from "@/lib/validation/employeeSchemas";
import { createEmployee } from "@/services/employees/createEmployee";

export async function createEmployeeAction(input: unknown) {
  const session = await auth();
  if (!session?.user || !hasPermission(session.user.role, PERMISSIONS.employees)) {
    throw new Error("Unauthorized");
  }

  const parsed = createEmployeeSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  try {
    await createEmployee(parsed.data);
  } catch (error) {
    return { success: false, message: (error as Error).message };
  }

  revalidatePath("/admin/employees");
  return { success: true, message: "Employee created." };
}

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") {
    redirect("/login");
  }
  return session;
}