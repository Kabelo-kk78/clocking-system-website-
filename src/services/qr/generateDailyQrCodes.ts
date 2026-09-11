import { listEmployeeUsers, findUserByUid } from "@/lib/firestore/users";
import { findQrByUserAndDate, createQrCode } from "@/lib/firestore/dailyQrCodes";
import { generateQrToken } from "@/lib/qr";
import { endOfDaySA } from "@/lib/dates";

export interface GeneratedQrResult {
  userId: string;
  date: string;
  token: string;
}

export async function generateDailyQrCodes(
  date: string,
  userId?: string
): Promise<GeneratedQrResult[]> {
  const active: NonNullable<Awaited<ReturnType<typeof findUserByUid>>>[] = [];

  if (userId) {
    const user = await findUserByUid(userId);
    if (user && user.isActive) active.push(user);
  } else {
    const employees = await listEmployeeUsers();
    active.push(...employees.filter((u) => u.isActive));
  }

  const results: GeneratedQrResult[] = [];
  for (const employee of active) {
    const existing = await findQrByUserAndDate(employee.uid, date);
    if (existing) {
      results.push({ userId: employee.uid, date, token: existing.token });
      continue;
    }

    const token = generateQrToken();
    const expiresAt = endOfDaySA(new Date());

    await createQrCode({
      token,
      userId: employee.uid,
      date,
      status: "pending",
      expiresAt,
      createdAt: new Date(),
    });
    results.push({ userId: employee.uid, date, token });
  }

  return results;
}
