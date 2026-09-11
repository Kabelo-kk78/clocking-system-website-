import { getAdminFirestore } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import type { UserRecord } from "./types";

const usersCol = () => getAdminFirestore().collection("users");

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const normalized = email.toLowerCase();
  const snapshot = await usersCol().where("email", "==", normalized).limit(1).get();
  if (snapshot.empty) return null;
  return docToUser(snapshot.docs[0]);
}

export async function findUserByUid(uid: string): Promise<UserRecord | null> {
  const doc = await usersCol().doc(uid).get();
  if (!doc.exists) return null;
  return docToUser(doc);
}

export async function listEmployeeUsers(): Promise<UserRecord[]> {
  const snapshot = await usersCol().where("role", "==", "employee").get();
  return snapshot.docs
    .map(docToUser)
    .sort((a, b) => a.fullName.localeCompare(b.fullName));
}

export async function createUserRecord(record: UserRecord): Promise<void> {
  const data = {
    fullName: record.fullName,
    email: record.email.toLowerCase(),
    role: record.role,
    employeeNumber: record.employeeNumber ?? null,
    department: record.department ?? null,
    isActive: record.isActive,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };
  await usersCol().doc(record.uid).set(data);
}

export async function updateUserRecord(
  uid: string,
  updates: Partial<Pick<UserRecord, "fullName" | "email" | "department" | "isActive">>
): Promise<void> {
  const data: Record<string, unknown> = { updatedAt: FieldValue.serverTimestamp() };
  if (updates.fullName !== undefined) data.fullName = updates.fullName;
  if (updates.email !== undefined) data.email = updates.email.toLowerCase();
  if (updates.department !== undefined) data.department = updates.department ?? null;
  if (updates.isActive !== undefined) data.isActive = updates.isActive;
  await usersCol().doc(uid).update(data);
}

export async function setUserActive(uid: string, isActive: boolean): Promise<void> {
  await usersCol().doc(uid).update({
    isActive,
    updatedAt: FieldValue.serverTimestamp(),
  });
}

function docToUser(doc: FirebaseFirestore.DocumentSnapshot): UserRecord {
  const data = doc.data();
  if (!data) throw new Error("Missing user data");
  return {
    uid: doc.id,
    fullName: data.fullName,
    email: data.email,
    role: data.role,
    employeeNumber: data.employeeNumber ?? undefined,
    department: data.department ?? undefined,
    isActive: data.isActive !== false,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
  };
}

function toDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (value && typeof value === "object" && "toDate" in value) {
    return (value as { toDate: () => Date }).toDate();
  }
  return new Date();
}
