import { listEmployeeUsers } from "@/lib/firestore/users";

export interface EmployeeSummary {
  id: string;
  fullName: string;
  email: string;
  employeeNumber?: string;
  department?: string;
  isActive: boolean;
  createdAt: Date;
}

export async function getEmployees(): Promise<EmployeeSummary[]> {
  const employees = await listEmployeeUsers();
  return employees.map((e) => ({
    id: e.uid,
    fullName: e.fullName,
    email: e.email,
    employeeNumber: e.employeeNumber,
    department: e.department,
    isActive: e.isActive,
    createdAt: e.createdAt,
  }));
}
