import { getAdminFirestore } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";
import type { AttendanceRecordData } from "./types";

function attendanceFor(userId: string, date: string) {
  return getAdminFirestore().collection("attendance").doc(`${userId}__${date}`);
}

export async function findAttendanceByUserAndDate(
  userId: string,
  date: string
): Promise<AttendanceRecordData | null> {
  const doc = await attendanceFor(userId, date).get();
  if (!doc.exists) return null;
  return { ...doc.data(), id: doc.id } as AttendanceRecordData & { id: string };
}

export async function createAttendanceRecord(
  record: Omit<AttendanceRecordData, "createdAt">
): Promise<void> {
  await attendanceFor(record.userId, record.date).set({
    userId: record.userId,
    qrToken: record.qrToken,
    date: record.date,
    clockInAt: record.clockInAt,
    clockInCoords: record.clockInCoords,
    distanceFromGeofence: record.distanceFromGeofence,
    inGeofence: record.inGeofence,
    status: record.status,
    checkInMethod: record.checkInMethod,
    createdAt: FieldValue.serverTimestamp(),
  });
}

export async function listAttendanceByUser(userId: string, limit = 30): Promise<AttendanceRecordData[]> {
  const snapshot = await getAdminFirestore()
    .collection("attendance")
    .where("userId", "==", userId)
    .get();
  return snapshot.docs
    .map((d) => d.data() as AttendanceRecordData)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);
}

export async function listAttendanceByDate(date: string): Promise<AttendanceRecordData[]> {
  const snapshot = await getAdminFirestore()
    .collection("attendance")
    .where("date", "==", date)
    .get();
  return snapshot.docs.map((d) => d.data() as AttendanceRecordData);
}
