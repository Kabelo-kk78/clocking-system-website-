import { getAdminAuth, getFirebaseAdminApp } from "@/lib/firebase/admin";
import { createUserRecord, findUserByEmail } from "@/lib/firestore/users";
import type { CreateEmployeeInput } from "@/lib/validation/employeeSchemas";

export async function createEmployee(input: CreateEmployeeInput) {
  if (!getFirebaseAdminApp()) throw new Error("Firebase is not configured.");

  const existing = await findUserByEmail(input.email);
  if (existing) {
    throw new Error("An employee with this email already exists");
  }

  const auth = getAdminAuth();

  let uid: string;
  try {
    const created = await auth.createUser({
      email: input.email.toLowerCase(),
      password: input.password,
      displayName: input.fullName,
      emailVerified: true,
    });
    uid = created.uid;
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === "auth/email-already-exists") {
      throw new Error("An employee with this email already exists");
    }
    throw error;
  }

  await createUserRecord({
    uid,
    fullName: input.fullName,
    email: input.email.toLowerCase(),
    role: "employee",
    employeeNumber: input.employeeNumber,
    department: input.department,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  return {
    id: uid,
    fullName: input.fullName,
    email: input.email.toLowerCase(),
  };
}
