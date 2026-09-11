"use client";

import { useState } from "react";
import { sendTestEmailAction } from "@/actions/qr-codes/sendTestEmailAction";
import type { EmailSetupStatus } from "@/services/email/getEmailSetupStatus";
import { cn } from "@/lib/utils";

interface EmailStatusPanelProps {
  status: EmailSetupStatus;
  adminEmail: string;
}

function StatusRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "ok" | "warn" | "bad" | "muted";
}) {
  const dot =
    tone === "ok"
      ? "bg-green-400"
      : tone === "warn"
        ? "bg-amber-400"
        : tone === "bad"
          ? "bg-red-400"
          : "bg-neutral-500";
  return (
    <div className="flex items-center justify-between gap-3 py-1.5 text-sm">
      <span className="text-neutral-400">{label}</span>
      <span className={cn("flex items-center gap-2 font-medium", tone === "muted" ? "text-neutral-400" : "text-neutral-200")}>
        <span className={cn("h-2 w-2 rounded-full", dot)} />
        {value}
      </span>
    </div>
  );
}

export default function EmailStatusPanel({ status, adminEmail }: EmailStatusPanelProps) {
  const [to, setTo] = useState(adminEmail);
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function handleSendTest() {
    setSending(true);
    setMessage(null);
    const result = await sendTestEmailAction({ to });
    setSending(false);
    setMessage({ ok: result.ok, text: result.message });
  }

  return (
    <div className="glass-card p-5">
      <h2 className="text-lg font-semibold">Resend Email Setup</h2>
      <p className="mt-1 text-sm text-neutral-400">
        Daily QR codes are emailed to employees in real time via Resend. Status below reflects
        your current configuration.
      </p>

      <div className="mt-4 divide-y divide-white/5 border-y border-white/10">
        <StatusRow
          label="API key"
          value={
            status.apiKeyFormatValid
              ? "Configured"
              : status.apiKeyConfigured
                ? "Invalid format"
                : "Missing"
          }
          tone={status.apiKeyFormatValid ? "ok" : "bad"}
        />
        <StatusRow
          label="Sender address"
          value={status.senderEmail}
          tone={status.senderEmail ? "muted" : "bad"}
        />
        <StatusRow
          label="Sender domain in Resend"
          value={
            status.domainRegistered === true && status.domainVerified
              ? "Registered & verified"
              : status.domainRegistered === true
                ? "Registered — not verified"
                : status.domainRegistered === false
                  ? "Not registered"
                  : status.domainsError
                    ? `Unavailable (${status.domainsError})`
                    : "Unknown"
          }
          tone={
            status.domainRegistered === true && status.domainVerified
              ? "ok"
              : status.domainRegistered === true
                ? "warn"
                : status.domainRegistered === false
                  ? "bad"
                  : "muted"
          }
        />
        <StatusRow
          label="QR link base URL"
          value={status.appUrl}
          tone={status.appUrl.startsWith("https://") ? "ok" : "warn"}
        />
        <StatusRow
          label="Automatic daily send (cron)"
          value={status.cronConfigured ? `Enabled — ${status.cronSchedule}` : "Disabled"}
          tone={status.cronConfigured ? "ok" : "warn"}
        />
      </div>

      {status.domainRegistered === true && !status.domainVerified && (
        <p className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-300">
          {status.senderDomain} is registered but delivery to real inboxes is blocked until its
          DNS records are verified in Resend. Test emails to your own inbox will still show how
          the template renders.
        </p>
      )}

      <div className="mt-5 border-t border-white/10 pt-5">
        <h3 className="text-sm font-semibold">Validate real-time email delivery</h3>
        <p className="mt-1 text-sm text-neutral-400">
          Sends the exact daily-QR email template to an address now so you can confirm it arrives
          instantly and renders correctly.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <input
            type="email"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="you@example.com"
            className="w-72 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none focus:border-amber-500"
          />
          <button
            onClick={handleSendTest}
            disabled={sending || !to}
            className="rounded-lg bg-[#FFC107] px-4 py-2 text-sm font-bold text-[#0f1117] transition hover:bg-amber-400 disabled:opacity-60"
          >
            {sending ? "Sending…" : "Send Test Email"}
          </button>
        </div>
        {message && (
          <p
            className={cn(
              "mt-3 text-sm",
              message.ok ? "text-green-400" : "text-red-400"
            )}
          >
            {message.ok ? "✓ " : "✕ "}
            {message.text}
          </p>
        )}
      </div>
    </div>
  );
}