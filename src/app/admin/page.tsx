import { getTodayAttendance, hasDailyQrBeenSentForToday } from "@/services/attendance/getTodayAttendance";
import { todaySA } from "@/lib/dates";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";
import SendDailyQrButton from "@/components/admin/SendDailyQrButton";

export const metadata = { title: "Admin Dashboard" };

export default async function AdminDashboardPage() {
  const [data, qrSent] = await Promise.all([
    getTodayAttendance(),
    hasDailyQrBeenSentForToday(),
  ]);
  const today = todaySA();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-neutral-400">Today&apos;s attendance overview — {today}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Employees" value={data.totalEmployees} accent="neutral" />
        <StatCard label="Present" value={data.present} accent="green" />
        <StatCard label="Absent" value={data.absent} accent="red" />
        <StatCard label="Late" value={data.late} accent="amber" />
      </div>

      <div className="glass-card p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Daily QR Codes</h2>
          <SendDailyQrButton date={today} alreadySent={qrSent} />
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="border-b border-white/10 px-5 py-4">
          <h2 className="text-lg font-semibold">Today&apos;s Attendance</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-neutral-400">
                <th className="px-5 py-3 font-medium">Employee</th>
                <th className="px-5 py-3 font-medium">Department</th>
                <th className="px-5 py-3 font-medium">Clock In</th>
                <th className="px-5 py-3 font-medium">Distance</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((row) => (
                <tr key={row.userId} className="border-b border-white/5">
                  <td className="px-5 py-3">
                    <p className="font-medium">{row.fullName}</p>
                    <p className="text-xs text-neutral-500">{row.email}</p>
                  </td>
                  <td className="px-5 py-3 text-neutral-300">{row.department ?? "—"}</td>
                  <td className="px-5 py-3 text-neutral-300">
                    {row.clockInAt
                      ? new Intl.DateTimeFormat("en-ZA", {
                          timeZone: "Africa/Johannesburg",
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
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
              {data.rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-neutral-500">
                    No employees yet. Add employees from the Employees page.
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