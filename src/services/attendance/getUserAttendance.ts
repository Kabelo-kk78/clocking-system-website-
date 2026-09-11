import { listAttendanceByUser } from "@/lib/firestore/attendance";

export interface UserAttendanceRow {
  id: string;
  date: string;
  clockInAt?: Date;
  status: "on_time" | "late" | "no_show";
  distance?: number;
  inGeofence?: boolean;
}

export interface UserAttendanceSummary {
  totalWorkingDays: number;
  present: number;
  absent: number;
  late: number;
  onTime: number;
}

export async function getUserAttendance(
  userId: string,
  limit = 30
): Promise<{ rows: UserAttendanceRow[]; summary: UserAttendanceSummary }> {
  const records = await listAttendanceByUser(userId, limit);

  const rows: UserAttendanceRow[] = records.map((record) => ({
    id: `${record.userId}__${record.date}`,
    date: record.date,
    clockInAt: record.clockInAt,
    status: record.status,
    distance: record.distanceFromGeofence,
    inGeofence: record.inGeofence,
  }));

  const present = records.length;
  const late = records.filter((r) => r.status === "late").length;

  return {
    rows,
    summary: {
      totalWorkingDays: present,
      present,
      absent: 0,
      late,
      onTime: present - late,
    },
  };
}
