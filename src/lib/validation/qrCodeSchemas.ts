import { z } from "zod";

export const qrTokenSchema = z.object({
  token: z.string().min(10, "Invalid QR code token"),
});

export const testEmailSchema = z.object({
  to: z.string().email("Enter a valid email address"),
});

export type QrTokenInput = z.infer<typeof qrTokenSchema>;
export type TestEmailInput = z.infer<typeof testEmailSchema>;