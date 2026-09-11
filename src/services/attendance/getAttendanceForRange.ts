import { listAttendanceByDate } from "@/lib/firestore/attendance";
import { listEmployeeUsers } from "@/lib/firestore/users";

export interface AttendanceDetailRow {
  id: string;
  fullName: string;
  email: string;
  department?: string;
  employeeNumber?: string;
  date: string;
  clockInAt?: Date;
  status: "on_time" | "late" | "no_show";
  distance?: number;
  inGeofence?: boolean;
}

export interface AttendanceDateSummary {
  totalEmployees: number;
  present: number;
  absent: number;
  late: number;
}

export async function getAttendanceForRange(
  date: string,
  status?: "on_time" | "late" | "no_show"
): Promise<{ rows: AttendanceDetailRow[]; summary: AttendanceDateSummary }> {
  const employees = await listEmployeeUsers();
  const records = await listAttendanceByDate(date);

  const byUser = new Map<string, (typeof records)[number]>();
  for (const record of records) {
    byUser.set(record.userId, record);
  }

  const rows: AttendanceDetailRow[] = employees.map((employee) => {
    const record = byUser.get(employee.uid);
    return {
      id: employee.uid,
      fullName: employee.fullName,
      email: employee.email,
      department: employee.department,
      employeeNumber: employee.employeeNumber,
      date,
      clockInAt: record?.clockInAt,
      status: record?.status ?? "no_show",
      distance: record?.distanceFromGeofence,
      inGeofence: record?.inGeofence,
    };
  });

  const filtered = status ? rows.filter((r) => r.status === status) : rows;
  const present = rows.filter((r) => r.status !== "no_show").length;
  const late = rows.filter((r) => r.status === "late").length;
  const absent = rows.length - present;

  return {
    rows: filtered,
    summary: { totalEmployees: rows.length, present, absent, late },
  };
}
