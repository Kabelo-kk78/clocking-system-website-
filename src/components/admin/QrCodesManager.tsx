"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { adminSendDailyCodesAction } from "@/actions/attendance/checkInAction";
import { viewQrCodeAction } from "@/actions/qr-codes/viewQrCodeAction";
import { resendQrCodeAction } from "@/actions/qr-codes/resendQrCodeAction";
import type { QrCodeView } from "@/services/qr/getQrCodeView";
import type { DailyQrOverview } from "@/services/qr/getDailyQrOverview";
import type { GeofenceConfig } from "@/lib/geofence";
import type { EmailSetupStatus } from "@/services/email/getEmailSetupStatus";
import StatCard from "@/components/ui/StatCard";
import QrCodeTable from "@/components/admin/QrCodeTable";
import EmailStatusPanel from "@/components/admin/EmailStatusPanel";
import { formatDateSA, formatTimeSA } from "@/lib/dates";
import { cn } from "@/lib/utils";

interface QrCodesManagerProps {
  date: string;
  overview: DailyQrOverview;
  geofence: GeofenceConfig;
  workStartTime: string;
  emailStatus: EmailSetupStatus;
  adminEmail: string;
}

export default function QrCodesManager({
  date,
  overview,
  geofence,
  workStartTime,
  emailStatus,
  adminEmail,
}: QrCodesManagerProps) {
  const router = useRouter();
  const dateLabel = formatDateSA(new Date(`${date}T12:00:00Z`));

  const [sending, setSending] = useState(false);
  const [sendMessage, setSendMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [resendingToken, setResendingToken] = useState<string | null>(null);
  const [flash, setFlash] = useState<{ ok: boolean; text: string } | null>(null);
  const [view, setView] = useState<QrCodeView | null>(null);
  const [viewError, setViewError] = useState<string | null>(null);

  async function handleSendToday() {
    setSending(true);
    setSendMessage(null);
    try {
      const result = await adminSendDailyCodesAction(date);
      setSendMessage({
        ok: true,
        text: `Generated ${result.generated}, emailed ${result.sent}, ${result.failed} failed.`,
      });
    } catch {
      setSendMessage({ ok: false, text: "Something went wrong. Please try again." });
    } finally {
      setSending(false);
      router.refresh();
    }
  }

  async function handleView(token: string) {
    setView(null);
    setViewError(null);
    const result = await viewQrCodeAction({ token });
    if (result.ok && result.data) {
      setView(result.data);
    } else if (result.ok) {
      setViewError("Could not load the QR code.");
    } else {
      setViewError(result.message ?? "Could not load the QR code.");
    }
  }

  async function handleResend(token: string) {
    setResendingToken(token);
    setFlash(null);
    const result = await resendQrCodeAction({ token });
    setFlash({ ok: result.ok, text: result.message });
    setResendingToken(null);
    router.refresh();
  }

  const validationRules = [
    {
      label: "Unique code",
      detail: "One random, single-use token per employee per day.",
    },
    {
      label: "Valid date",
      detail: `Accepted on ${dateLabel} only.`,
    },
    {
      label: "Expiry",
      detail: "Expires at the end of the day (23:59 SAST).",
    },
    {
      label: "Single use",
      detail: "The code is marked used and cannot be scanned twice.",
    },
    {
      label: "Employee active",
      detail: "Your account must be active to clock in.",
    },
    {
      label: "Geofence",
      detail: `Device must be within ${geofence.radiusMeters}m of the office (${geofence.latitude}, ${geofence.longitude}).`,
    },
    {
      label: "On time",
      detail: `Scans after ${workStartTime} (SAST) are recorded as late.`,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Employees" value={overview.totalEmployees} accent="neutral" />
        <StatCard label="Codes Generated" value={overview.generated} accent="neutral" />
        <StatCard
          label="Emailed"
          value={overview.sent + overview.used}
          hint={`${overview.pending} pending`}
          accent="amber"
        />
        <StatCard label="Clocked In" value={overview.clockedIn} accent="green" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-card p-5">
          <h2 className="text-lg font-semibold">Send Today&apos;s Codes</h2>
          <p className="mt-1 text-sm text-neutral-400">
            Generated for {dateLabel}. Each active employee gets a unique QR code emailed to
            their inbox, which they scan on their device when arriving.
          </p>
          <div className="mt-4 space-y-2">
            <button
              onClick={handleSendToday}
              disabled={sending}
              className="rounded-lg bg-[#FFC107] px-4 py-2 text-sm font-bold text-[#0f1117] transition hover:bg-amber-400 disabled:opacity-60"
            >
              {sending ? "Sending…" : "Send Today&apos;s Daily QR Codes"}
            </button>
            {sendMessage && (
              <p
                className={cn(
                  "text-sm",
                  sendMessage.ok ? "text-green-400" : "text-red-400"
                )}
              >
                {sendMessage.text}
              </p>
            )}
          </div>
        </div>

        <div className="glass-card p-5">
          <h2 className="text-lg font-semibold">How a Scan Is Validated</h2>
          <p className="mt-1 text-sm text-neutral-400">
            When an employee scans their QR on arrival, the system checks:
          </p>
          <ul className="mt-4 space-y-2">
            {validationRules.map((rule) => (
              <li key={rule.label} className="flex gap-3 text-sm">
                <span className="mt-0.5 text-[#FFC107]">✓</span>
                <span>
                  <span className="font-semibold text-white">{rule.label}:</span>{" "}
                  <span className="text-neutral-300">{rule.detail}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {flash && (
        <p
          className={cn(
            "rounded-lg border px-4 py-2 text-sm",
            flash.ok
              ? "border-green-500/30 bg-green-500/10 text-green-400"
              : "border-red-500/30 bg-red-500/10 text-red-400"
          )}
        >
          {flash.ok ? "✓ " : "✕ "}
          {flash.text}
        </p>
      )}

      <QrCodeTable
        date={date}
        rows={overview.rows}
        resendingToken={resendingToken}
        onView={handleView}
        onResend={handleResend}
      />

      <EmailStatusPanel status={emailStatus} adminEmail={adminEmail} />

      {(view || viewError) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => {
            setView(null);
            setViewError(null);
          }}
        >
          <div
            className="glass-card w-full max-w-sm p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            {view ? (
              <QrCodeViewContent view={view} onClose={() => setView(null)} />
            ) : (
              <div>
                <p className="text-sm text-red-400">{viewError}</p>
                <button
                  onClick={() => setViewError(null)}
                  className="mt-4 rounded-lg border border-neutral-700 px-4 py-2 text-sm font-semibold text-neutral-300 transition hover:bg-neutral-800"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function QrCodeViewContent({ view, onClose }: { view: QrCodeView; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(view.checkInUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div>
      <h3 className="text-xl font-bold">{view.fullName}</h3>
      <p className="text-xs text-neutral-500">
        {view.employeeNumber ? `${view.employeeNumber} · ` : ""}
        {formatDateSA(new Date(`${view.date}T12:00:00Z`))}
      </p>
      <Image
        src={view.qrDataUrl}
        alt={`Daily QR code for ${view.fullName}`}
        width={224}
        height={224}
        unoptimized
        className="mx-auto mt-4"
      />
      <p className="mt-3 text-sm text-neutral-400">
        {view.usedAt ? `Used at ${formatTimeSA(view.usedAt)}` : "Not used yet"}
      </p>
      <button
        onClick={handleCopy}
        className="mt-4 w-full rounded-lg border border-neutral-700 px-4 py-2 text-sm font-semibold text-neutral-300 transition hover:bg-neutral-800"
      >
        {copied ? "Copied ✓" : "Copy check-in link"}
      </button>
      <button
        onClick={onClose}
        className="mt-2 w-full rounded-lg bg-[#FFC107] px-4 py-2 text-sm font-bold text-[#0f1117] transition hover:bg-amber-400"
      >
        Close
      </button>
    </div>
  );
}