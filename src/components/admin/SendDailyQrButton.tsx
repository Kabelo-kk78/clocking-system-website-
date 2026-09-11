"use client";

import { useState } from "react";
import { adminSendDailyCodesAction } from "@/actions/attendance/checkInAction";

interface SendDailyQrButtonProps {
  date: string;
  alreadySent: boolean;
}

export default function SendDailyQrButton({ date, alreadySent }: SendDailyQrButtonProps) {
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [sent, setSent] = useState(alreadySent);

  async function handleSend() {
    setSending(true);
    setMessage(null);
    const result = await adminSendDailyCodesAction(date);
    setSending(false);
    setSent(true);
    setMessage(
      `Generated ${result.generated} code(s), emailed ${result.sent}, ${result.failed} failed.`
    );
  }

  if (sent && !message) {
    return (
      <p className="text-sm text-neutral-400">
        Daily QR codes for today have been sent.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <button
        onClick={handleSend}
        disabled={sending}
        className="rounded-lg bg-[#FFC107] px-4 py-2 text-sm font-bold text-[#0f1117] transition hover:bg-amber-400 disabled:opacity-60"
      >
        {sending ? "Sending…" : "Send Today's Daily QR Codes"}
      </button>
      {message && <p className="text-xs text-neutral-400">{message}</p>}
    </div>
  );
}