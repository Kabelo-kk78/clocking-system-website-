import {
  isWithinGeofence,
  distanceFromGeofenceMeters,
  getGeofence,
} from "@/lib/geofence";
import { todaySA, isLate } from "@/lib/dates";
import type { CheckInInput } from "@/lib/validation/attendanceSchemas";
import { findQrByToken, updateQrStatus } from "@/lib/firestore/dailyQrCodes";
import { findUserByUid } from "@/lib/firestore/users";
import {
  findAttendanceByUserAndDate,
  createAttendanceRecord,
} from "@/lib/firestore/attendance";

export interface CheckInResult {
  success: boolean;
  message: string;
  data?: {
    fullName: string;
    clockInAt: Date;
    distance: number;
    withinRadiusMeters: number;
    status: string;
  };
}

export async function processCheckIn(input: CheckInInput): Promise<CheckInResult> {
  const qr = await findQrByToken(input.token);
  if (!qr) {
    return { success: false, message: "Invalid QR code. Please try again." };
  }

  const today = todaySA();
  if (qr.date !== today) {
    return { success: false, message: "This QR code is not valid for today." };
  }

  if (qr.expiresAt.getTime() < Date.now()) {
    return { success: false, message: "This QR code has expired." };
  }

  if (qr.status === "used") {
    return { success: false, message: "This QR code has already been used." };
  }

  const user = await findUserByUid(qr.userId);
  if (!user || !user.isActive) {
    return { success: false, message: "Account not found or inactive." };
  }

  const within = isWithinGeofence(input.latitude, input.longitude);
  const radius = getGeofence().radiusMeters;
  const distance = distanceFromGeofenceMeters(input.latitude, input.longitude);

  if (!within) {
    return {
      success: false,
      message: `You are ${Math.round(distance)}m away from ${radius}m radius. Move closer to the workplace to clock in.`,
    };
  }

  const existing = await findAttendanceByUserAndDate(user.uid, today);
  if (existing) {
    return {
      success: false,
      message: "You have already clocked in today.",
    };
  }

  const clockInAt = new Date();
  const status = isLate(clockInAt) ? "late" : "on_time";

  try {
    await createAttendanceRecord({
      userId: user.uid,
      qrToken: qr.token,
      date: today,
      clockInAt,
      clockInCoords: { lat: input.latitude, lng: input.longitude },
      distanceFromGeofence: distance,
      inGeofence: within,
      status,
      checkInMethod: "qr_scan",
    });

    await updateQrStatus(qr.token, "used", { usedAt: clockInAt });

    return {
      success: true,
      message: "Clock-in successful.",
      data: {
        fullName: user.fullName,
        clockInAt,
        distance,
        withinRadiusMeters: radius,
        status,
      },
    };
  } catch {
    return { success: false, message: "Clock-in record could not be saved." };
  }
}
