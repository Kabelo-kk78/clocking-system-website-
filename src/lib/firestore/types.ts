export type UserRole = "admin" | "employee";

export interface UserRecord {
  uid: string;
  fullName: string;
  email: string;
  role: UserRole;
  employeeNumber?: string;
  department?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type AttendanceStatus = "on_time" | "late" | "no_show";

export interface AttendanceRecordData {
  userId: string;
  qrToken: string;
  date: string;
  clockInAt: Date;
  clockInCoords: { lat: number; lng: number };
  distanceFromGeofence: number;
  inGeofence: boolean;
  status: AttendanceStatus;
  checkInMethod: string;
  createdAt: Date;
}

export type QrCodeStatus = "pending" | "sent" | "used";

export interface DailyQrCodeData {
  token: string;
  userId: string;
  date: string;
  status: QrCodeStatus;
  sentAt?: Date;
  usedAt?: Date;
  expiresAt: Date;
  createdAt: Date;
}
