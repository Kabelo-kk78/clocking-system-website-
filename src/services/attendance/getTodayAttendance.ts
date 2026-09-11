import { listAttendanceByDate } from "@/lib/firestore/attendance";
import { listEmployeeUsers } from "@/lib/firestore/users";
import { todaySA } from "@/lib/dates";

export interface TodayAttendanceRow {
  userId: string;
  fullName: string;
  email: string;
  department?: string;
  employeeNumber?: string;
  status: "on_time" | "late" | "no_show";
  clockInAt?: Date;
  distance?: number;
}

export async function getTodayAttendance(): Promise<{
  rows: TodayAttendanceRow[];
  present: number;
  absent: number;
  late: number;
  totalEmployees: number;
}> {
  const today = todaySA();

  const employees = await listEmployeeUsers();
  const records = await listAttendanceByDate(today);

  const byUser = new Map<string, (typeof records)[number]>();
  for (const record of records) {
    byUser.set(record.userId, record);
  }

  const rows: TodayAttendanceRow[] = employees.map((employee) => {
    const record = byUser.get(employee.uid);
    return {
      userId: employee.uid,
      fullName: employee.fullName,
      email: employee.email,
      department: employee.department,
      employeeNumber: employee.employeeNumber,
      status: record?.status ?? "no_show",
      clockInAt: record?.clockInAt,
      distance: record?.distanceFromGeofence,
    };
  });

  const present = rows.filter((r) => r.status !== "no_show").length;
  const late = rows.filter((r) => r.status === "late").length;
  const absent = rows.length - present;

  return { rows, present, absent, late, totalEmployees: rows.length };
}

export async function hasDailyQrBeenSentForToday(): Promise<boolean> {
  const { countSentQrForDate } = await import("@/lib/firestore/dailyQrCodes");
  const today = todaySA();
  const sent = await countSentQrForDate(today);
  return sent > 0;
}
