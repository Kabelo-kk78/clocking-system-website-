import type { UserRole } from "@/lib/firestore/types";

export const PERMISSIONS = {
  attendance: "attendance:read",
  employees: "employees:manage",
  qrCodes: "qrcodes:manage",
  admin: "admin:all",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

const rolePermissions: Record<UserRole, Permission[]> = {
  admin: [
    PERMISSIONS.attendance,
    PERMISSIONS.employees,
    PERMISSIONS.qrCodes,
    PERMISSIONS.admin,
  ],
  employee: [],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return rolePermissions[role]?.includes(permission) ?? false;
}