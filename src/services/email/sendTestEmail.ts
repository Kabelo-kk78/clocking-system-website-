import QRCode from "qrcode";
import { buildCheckInUrl } from "@/lib/qr";
import { formatDateSA } from "@/lib/dates";

export interface SendTestEmailResult {
  ok: boolean;
  message: string;
  id?: string;
}

export async function sendTestEmail(to: string): Promise<SendTestEmailResult> {
  const apiKey = process.env.RESEND_API_KEY ?? "";
  if (!apiKey.startsWith("re_") || apiKey.length < 20) {
    return {
      ok: false,
      message:
        "RESEND_API_KEY is missing or invalid (must start with re_). Set a real key in your environment.",
    };
  }

  try {
    const [{ resend, getEmailFrom }, { render }, { default: DailyQrEmail }] =
      await Promise.all([
        import("@/lib/resend"),
        import("@react-email/components"),
        import("@/components/emails/DailyQrEmail"),
      ]);

    const dateLabel = formatDateSA(new Date());
    const testToken = `test-${Date.now().toString(36)}`;
    const checkInUrl = buildCheckInUrl(testToken);

    const qrBuffer = await QRCode.toBuffer(checkInUrl, {
      type: "png",
      width: 300,
      margin: 2,
    });
    const qrBase64 = qrBuffer.toString("base64");

    const template = DailyQrEmail({
      fullName: "Test Recipient",
      date: dateLabel,
      qrDataUrl: "cid:qr-test",
      checkInUrl,
    });

    const [html, text] = await Promise.all([
      render(template),
      render(template, { plainText: true }),
    ]);

    const { data, error } = await resend.emails.send({
      from: getEmailFrom(),
      to,
      subject: `Test — Your Daily QR Email (${dateLabel})`,
      html,
      text,
      attachments: [
        {
          filename: "qr-code.png",
          content: qrBase64,
          contentId: "qr-test",
        },
      ],
    });

    if (error) {
      console.error("sendTestEmail error:", error);
      return { ok: false, message: error.message };
    }

    return {
      ok: true,
      message: `Delivered to ${to} — check your inbox now.`,
      id: data?.id,
    };
  } catch (error) {
    console.error("sendTestEmail error:", error);
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Test email could not be sent.",
    };
  }
}