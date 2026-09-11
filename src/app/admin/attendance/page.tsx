import { getAttendanceForRange } from "@/services/attendance/getAttendanceForRange";
import { todaySA } from "@/lib/dates";
import DailyAttendanceTable from "@/components/admin/DailyAttendanceTable";

export const metadata = { title: "Attendance Records" };

interface PageProps {
  searchParams: Promise<{ date?: string; status?: string }>;
}

export default async function AdminAttendancePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const date = params.date ?? todaySA();
  const status = (params.status as "on_time" | "late" | "no_show" | undefined) ?? undefined;
  const { rows, summary } = await getAttendanceForRange(date, status);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Attendance Records</h1>
        <p className="text-sm text-neutral-400">Daily clock-in records by employee</p>
      </div>

      <DailyAttendanceTable
        date={date}
        status={status}
        summary={summary}
        rows={rows}
      />
    </div>
  );
}