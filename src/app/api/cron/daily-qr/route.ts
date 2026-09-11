import { NextRequest, NextResponse } from "next/server";
import { todaySA } from "@/lib/dates";
import { generateAndSendDailyQrCodes } from "@/services/qr/generateAndSendDailyQrCodes";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET ?? ""}`;

  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const date = todaySA();
  const result = await generateAndSendDailyQrCodes(date);

  return NextResponse.json({ date, ...result });
}