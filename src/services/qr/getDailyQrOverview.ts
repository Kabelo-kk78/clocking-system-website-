import { listEmployeeUsers } from "@/lib/firestore/users";
import { listQrByDate } from "@/lib/firestore/dailyQrCodes";
import { listAttendanceByDate } from "@/lib/firestore/attendance";

export type QrDeliveryStatus = "none" | "pending" | "sent" | "used";

export interface DailyQrOverviewRow {
  userId: string;
  fullName: string;
  email: string;
  employeeNumber?: string;
  department?: string;
  isActive: boolean;
  token?: string;
  qrStatus: QrDeliveryStatus;
  sentAt?: Date;
  usedAt?: Date;
  clockedIn: boolean;
  attendanceStatus: "on_time" | "late" | "no_show";
}

export interface DailyQrOverview {
  date: string;
  rows: DailyQrOverviewRow[];
  totalEmployees: number;
  generated: number;
  sent: number;
  used: number;
  pending: number;
  clockedIn: number;
}

export async function getDailyQrOverview(date: string): Promise<DailyQrOverview> {
  const [employees, qrs, records] = await Promise.all([
    listEmployeeUsers(),
    listQrByDate(date),
    listAttendanceByDate(date),
  ]);

  const qrByUser = new Map(qrs.map((q) => [q.userId, q]));
  const recordByUser = new Map(records.map((r) => [r.userId, r]));

  const rows: DailyQrOverviewRow[] = employees.map((employee) => {
    const qr = qrByUser.get(employee.uid);
    const record = recordByUser.get(employee.uid);
    return {
      userId: employee.uid,
      fullName: employee.fullName,
      email: employee.email,
      employeeNumber: employee.employeeNumber,
      department: employee.department,
      isActive: employee.isActive,
      token: qr?.token,
      qrStatus: qr ? qr.status : "none",
      sentAt: qr?.sentAt,
      usedAt: qr?.usedAt,
      clockedIn: Boolean(record),
      attendanceStatus: record?.status ?? "no_show",
    };
  });

  const hasCode = (r: DailyQrOverviewRow) => r.qrStatus !== "none";

  return {
    date,
    rows,
    totalEmployees: rows.length,
    generated: rows.filter(hasCode).length,
    sent: rows.filter((r) => r.qrStatus === "sent").length,
    used: rows.filter((r) => r.qrStatus === "used").length,
    pending: rows.filter((r) => r.qrStatus === "pending").length,
    clockedIn: rows.filter((r) => r.clockedIn).length,
  };
}