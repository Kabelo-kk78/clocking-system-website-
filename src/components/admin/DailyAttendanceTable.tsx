"use client";

import { useRouter } from "next/navigation";
import type { AttendanceDetailRow } from "@/services/attendance/getAttendanceForRange";
import StatusBadge from "@/components/ui/StatusBadge";

interface Props {
  date: string;
  status?: "on_time" | "late" | "no_show";
  summary: { totalEmployees: number; present: number; absent: number; late: number };
  rows: AttendanceDetailRow[];
}

export default function DailyAttendanceTable({ date, status, summary, rows }: Props) {
  const router = useRouter();

  function setDate(value: string) {
    router.push(`/admin/attendance?date=${value}${status ? `&status=${status}` : ""}`);
  }

  function setStatus(value: string) {
    router.push(`/admin/attendance?date=${date}${value ? `&status=${value}` : ""}`);
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="glass-card p-4">
          <p className="text-sm text-neutral-400">Total</p>
          <p className="text-2xl font-bold">{summary.totalEmployees}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-sm text-neutral-400">Present</p>
          <p className="text-2xl font-bold text-green-400">{summary.present}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-sm text-neutral-400">Late</p>
          <p className="text-2xl font-bold text-amber-400">{summary.late}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-sm text-neutral-400">Absent</p>
          <p className="text-2xl font-bold text-red-400">{summary.absent}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm text-neutral-400">Date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-amber-500"
        />
        <label className="text-sm text-neutral-400">Status</label>
        <select
          value={status ?? ""}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-amber-500"
        >
          <option value="">All</option>
          <option value="on_time">On Time</option>
          <option value="late">Late</option>
          <option value="no_show">No Show</option>
        </select>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-neutral-400">
                <th className="px-5 py-3 font-medium">Employee</th>
                <th className="px-5 py-3 font-medium">ID</th>
                <th className="px-5 py-3 font-medium">Department</th>
                <th className="px-5 py-3 font-medium">Clock In</th>
                <th className="px-5 py-3 font-medium">Distance</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-white/5">
                  <td className="px-5 py-3">
                    <p className="font-medium">{row.fullName}</p>
                    <p className="text-xs text-neutral-500">{row.email}</p>
                  </td>
                  <td className="px-5 py-3 text-neutral-300">{row.employeeNumber ?? "—"}</td>
                  <td className="px-5 py-3 text-neutral-300">{row.department ?? "—"}</td>
                  <td className="px-5 py-3 text-neutral-300">
                    {row.clockInAt
                      ? new Intl.DateTimeFormat("en-ZA", {
                          timeZone: "Africa/Johannesburg",
                          hour: "2-digit",
                          minute: "2-digit",
                        }).format(row.clockInAt)
                      : "—"}
                  </td>
                  <td className="px-5 py-3 text-neutral-300">
                    {row.distance !== undefined ? `${Math.round(row.distance)}m` : "—"}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={row.status} />
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-neutral-500">
                    No attendance records for this date.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}