import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getUserAttendance } from "@/services/attendance/getUserAttendance";
import { todaySA, formatDateSA, formatTimeSA } from "@/lib/dates";
import StatCard from "@/components/ui/StatCard";

export const metadata = { title: "My Attendance" };

export default async function EmployeeDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { rows, summary } = await getUserAttendance(session.user.id, 30);
  const today = todaySA();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">My Attendance</h1>
        <p className="text-sm text-neutral-400">
          Welcome back, {session.user.fullName}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Clock-ins (30 days)" value={summary.present} accent="neutral" />
        <StatCard label="On Time" value={summary.onTime} accent="green" />
        <StatCard label="Late" value={summary.late} accent="amber" />
      </div>

      <div className="glass-card overflow-hidden">
        <div className="border-b border-white/10 px-5 py-4">
          <h2 className="text-lg font-semibold">Recent Clock-in History</h2>
          <p className="text-xs text-neutral-500">Today: {formatDateSA(new Date(`${today}T12:00:00Z`))}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-neutral-400">
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Clock In</th>
                <th className="px-5 py-3 font-medium">Distance</th>
                <th className="px-5 py-3 font-medium">Geofence</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-white/5">
                  <td className="px-5 py-3 font-medium">
                    {formatDateSA(new Date(`${row.date}T12:00:00Z`))}
                  </td>
                  <td className="px-5 py-3 text-neutral-300">
                    {row.clockInAt ? formatTimeSA(row.clockInAt) : "—"}
                  </td>
                  <td className="px-5 py-3 text-neutral-300">
                    {row.distance !== undefined ? `${Math.round(row.distance)}m` : "—"}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={
                        row.inGeofence
                          ? "text-green-400"
                          : row.inGeofence === false
                            ? "text-red-400"
                            : "text-neutral-500"
                      }
                    >
                      {row.inGeofence ? "Within" : row.inGeofence === false ? "Outside" : "—"}
                    </span>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-neutral-500">
                    No clock-in records yet. Use your daily QR code to clock in when you arrive.
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