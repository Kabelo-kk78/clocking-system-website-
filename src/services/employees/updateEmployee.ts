import { getAdminAuth } from "@/lib/firebase/admin";
import { findUserByUid, updateUserRecord } from "@/lib/firestore/users";
import type { UpdateEmployeeInput } from "@/lib/validation/employeeSchemas";

export async function updateEmployee(input: UpdateEmployeeInput) {
  const existing = await findUserByUid(input.id);
  if (!existing) throw new Error("Employee not found");

  const updates: Parameters<typeof updateUserRecord>[1] = {};
  if (input.fullName) updates.fullName = input.fullName;
  if (input.email) updates.email = input.email.toLowerCase();
  if (input.department !== undefined) updates.department = input.department;
  if (input.isActive !== undefined) updates.isActive = input.isActive;

  await updateUserRecord(input.id, updates);

  const auth = getAdminAuth();
  const authUpdates: { displayName?: string; email?: string; disabled?: boolean } = {};
  if (input.fullName) authUpdates.displayName = input.fullName;
  if (input.email) authUpdates.email = input.email.toLowerCase();
  if (input.isActive !== undefined) authUpdates.disabled = !input.isActive;

  if (Object.keys(authUpdates).length > 0) {
    await auth.updateUser(input.id, authUpdates);
  }

  return {
    id: input.id,
    fullName: updates.fullName ?? existing.fullName,
    email: updates.email ?? existing.email,
    isActive: updates.isActive ?? existing.isActive,
  };
}
