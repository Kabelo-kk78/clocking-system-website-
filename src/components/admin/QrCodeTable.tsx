"use client";

import type { DailyQrOverviewRow } from "@/services/qr/getDailyQrOverview";
import StatusBadge from "@/components/ui/StatusBadge";
import { formatTimeSA, formatDateSA } from "@/lib/dates";
import { cn } from "@/lib/utils";

interface QrCodeTableProps {
  date: string;
  rows: DailyQrOverviewRow[];
  resendingToken: string | null;
  onView: (token: string) => void;
  onResend: (token: string) => void;
}

const qrBadge: Record<string, { label: string; classes: string }> = {
  none: {
    label: "Not generated",
    classes: "bg-neutral-500/15 text-neutral-400 border-neutral-500/30",
  },
  pending: {
    label: "Pending",
    classes: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  },
  sent: {
    label: "Emailed",
    classes: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  },
  used: {
    label: "Used",
    classes: "bg-green-500/15 text-green-400 border-green-500/30",
  },
};

export default function QrCodeTable({
  date,
  rows,
  resendingToken,
  onView,
  onResend,
}: QrCodeTableProps) {
  const dateLabel = formatDateSA(new Date(`${date}T12:00:00Z`));

  return (
    <div className="glass-card overflow-hidden">
      <div className="border-b border-white/10 px-5 py-4">
        <h2 className="text-lg font-semibold">Today&apos;s Codes by Employee</h2>
        <p className="text-xs text-neutral-500">{dateLabel}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-neutral-400">
              <th className="px-5 py-3 font-medium">Employee</th>
              <th className="px-5 py-3 font-medium">QR Code</th>
              <th className="px-5 py-3 font-medium">Emailed At</th>
              <th className="px-5 py-3 font-medium">Used At</th>
              <th className="px-5 py-3 font-medium">Clock In</th>
              <th className="px-5 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const badge = qrBadge[row.qrStatus];
              return (
                <tr key={row.userId} className="border-b border-white/5">
                  <td className="px-5 py-3">
                    <p className={cn("font-medium", !row.isActive && "text-neutral-500")}>
                      {row.fullName}
                      {!row.isActive && (
                        <span className="ml-2 text-xs font-normal text-neutral-500">
                          (inactive)
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-neutral-500">{row.email}</p>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                        badge.classes
                      )}
                    >
                      {badge.label}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-neutral-300">
                    {row.sentAt ? formatTimeSA(row.sentAt) : "—"}
                  </td>
                  <td className="px-5 py-3 text-neutral-300">
                    {row.usedAt ? formatTimeSA(row.usedAt) : "—"}
                  </td>
                  <td className="px-5 py-3">
                    {row.clockedIn ? <StatusBadge status={row.attendanceStatus} /> : <span className="text-neutral-500">—</span>}
                  </td>
                  <td className="px-5 py-3">
                    {row.token ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onView(row.token!)}
                          className="rounded-md border border-neutral-700 px-2.5 py-1 text-xs font-semibold text-neutral-300 transition hover:bg-neutral-800"
                        >
                          View QR
                        </button>
                        {row.qrStatus !== "used" && (
                          <button
                            onClick={() => onResend(row.token!)}
                            disabled={resendingToken === row.token}
                            className="rounded-md border border-neutral-700 px-2.5 py-1 text-xs font-semibold text-neutral-300 transition hover:bg-neutral-800 disabled:opacity-50"
                          >
                            {resendingToken === row.token ? "Sending…" : "Email again"}
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-neutral-500">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-neutral-500">
                  No employees yet. Add employees from the Employees page.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}