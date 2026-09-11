import { generateDailyQrCodes } from "@/services/qr/generateDailyQrCodes";
import { sendDailyQrEmail } from "@/services/email/sendDailyQrEmail";

export async function generateAndSendDailyQrCodes(
  date: string,
  userId?: string
): Promise<{ generated: number; sent: number; failed: number }> {
  const results = await generateDailyQrCodes(date, userId);

  let sent = 0;
  let failed = 0;

  for (const result of results) {
    const ok = await sendDailyQrEmail(result.token);
    if (ok) sent += 1;
    else failed += 1;
  }

  return { generated: results.length, sent, failed };
}
