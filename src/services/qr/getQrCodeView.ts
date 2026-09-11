import { findQrByToken } from "@/lib/firestore/dailyQrCodes";
import { findUserByUid } from "@/lib/firestore/users";
import { buildCheckInUrl, generateQrDataUrl } from "@/lib/qr";

export interface QrCodeView {
  token: string;
  fullName: string;
  employeeNumber?: string;
  date: string;
  status: "pending" | "sent" | "used";
  checkInUrl: string;
  qrDataUrl: string;
  sentAt?: Date;
  usedAt?: Date;
}

export async function getQrCodeView(token: string): Promise<QrCodeView | null> {
  const qr = await findQrByToken(token);
  if (!qr) return null;

  const user = await findUserByUid(qr.userId);
  if (!user) return null;

  const checkInUrl = buildCheckInUrl(qr.token);
  const qrDataUrl = await generateQrDataUrl(checkInUrl);

  return {
    token: qr.token,
    fullName: user.fullName,
    employeeNumber: user.employeeNumber,
    date: qr.date,
    status: qr.status,
    checkInUrl,
    qrDataUrl,
    sentAt: qr.sentAt,
    usedAt: qr.usedAt,
  };
}