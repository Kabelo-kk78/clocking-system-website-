import QRCode from "qrcode";
import { render } from "@react-email/components";
import { findQrByToken, updateQrStatus } from "@/lib/firestore/dailyQrCodes";
import { findUserByUid } from "@/lib/firestore/users";
import { resend, getEmailFrom } from "@/lib/resend";
import { buildCheckInUrl } from "@/lib/qr";
import { formatDateSA } from "@/lib/dates";
import DailyQrEmail from "@/components/emails/DailyQrEmail";

export async function sendDailyQrEmail(qrToken: string): Promise<boolean> {
  const qr = await findQrByToken(qrToken);
  if (!qr) return false;

  const user = await findUserByUid(qr.userId);
  if (!user) return false;

  const checkInUrl = buildCheckInUrl(qr.token);
  const dateLabel = formatDateSA(new Date(`${qr.date}T12:00:00Z`));

  const qrBuffer = await QRCode.toBuffer(checkInUrl, {
    type: "png",
    width: 300,
    margin: 2,
  });
  const qrBase64 = qrBuffer.toString("base64");

  const template = DailyQrEmail({
    fullName: user.fullName,
    date: dateLabel,
    employeeNumber: user.employeeNumber,
    qrDataUrl: "cid:qr-code",
    checkInUrl,
  });

  const [html, text] = await Promise.all([
    render(template),
    render(template, { plainText: true }),
  ]);

  const { data, error } = await resend.emails.send({
    from: getEmailFrom(),
    to: user.email,
    subject: `Your Daily QR Code for ${dateLabel}`,
    html,
    text,
    attachments: [
      {
        filename: "qr-code.png",
        content: qrBase64,
        contentId: "qr-code",
      },
    ],
  });

  if (error) {
    console.error("sendDailyQrEmail error:", error);
    return false;
  }

  console.log(`Sent daily QR email to ${user.email} (id: ${data?.id ?? "n/a"})`);
  await updateQrStatus(qr.token, "sent", { sentAt: new Date() });
  return true;
}