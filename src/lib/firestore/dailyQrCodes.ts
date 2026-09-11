import { getAdminFirestore } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import type { DailyQrCodeData } from "./types";

const qrCol = () => getAdminFirestore().collection("dailyQrCodes");

export async function findQrByToken(token: string): Promise<DailyQrCodeData | null> {
  const doc = await qrCol().doc(token).get();
  if (!doc.exists) return null;
  return docToQr(doc);
}

export async function findQrByUserAndDate(
  userId: string,
  date: string
): Promise<DailyQrCodeData | null> {
  const snapshot = await qrCol().where("userId", "==", userId).get();
  for (const doc of snapshot.docs) {
    if (doc.data()?.date === date) return docToQr(doc);
  }
  return null;
}

export async function createQrCode(data: DailyQrCodeData): Promise<void> {
  await qrCol().doc(data.token).set({
    userId: data.userId,
    date: data.date,
    token: data.token,
    status: data.status,
    sentAt: data.sentAt ?? null,
    usedAt: data.usedAt ?? null,
    expiresAt: data.expiresAt,
    createdAt: FieldValue.serverTimestamp(),
  });
}

export async function updateQrStatus(
  token: string,
  status: DailyQrCodeData["status"],
  extra?: Partial<{ sentAt: Date; usedAt: Date }>
): Promise<void> {
  const data: Record<string, unknown> = { status };
  if (extra?.sentAt) data.sentAt = extra.sentAt;
  if (extra?.usedAt) data.usedAt = extra.usedAt;
  await qrCol().doc(token).update(data);
}

export async function countSentQrForDate(date: string): Promise<number> {
  const snapshot = await qrCol().where("date", "==", date).get();
  return snapshot.docs.filter((d) => d.data()?.status !== "pending").length;
}

export async function listQrByDate(date: string): Promise<DailyQrCodeData[]> {
  const snapshot = await qrCol().where("date", "==", date).get();
  return snapshot.docs.map(docToQr);
}

function docToQr(doc: FirebaseFirestore.DocumentSnapshot): DailyQrCodeData {
  const data = doc.data();
  if (!data) throw new Error("Missing QR code data");
  return {
    token: doc.id,
    userId: data.userId,
    date: data.date,
    status: data.status,
    sentAt: toOptionalDate(data.sentAt),
    usedAt: toOptionalDate(data.usedAt),
    expiresAt: toDate(data.expiresAt),
    createdAt: toDate(data.createdAt),
  };
}

function toDate(value: unknown): Date {
  if (value === null || value === undefined) return new Date();
  if (value instanceof Date) return value;
  if (value && typeof value === "object" && "toDate" in value) {
    return (value as { toDate: () => Date }).toDate();
  }
  return new Date();
}

function toOptionalDate(value: unknown): Date | undefined {
  if (value === null || value === undefined) return undefined;
  return toDate(value);
}
