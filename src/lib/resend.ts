import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY ?? "";

export const resend = new Resend(apiKey);

export function getEmailFrom(): string {
  return process.env.EMAIL_FROM ?? "MDI Hub Attendance <noreply@mdihub.co.za>";
}