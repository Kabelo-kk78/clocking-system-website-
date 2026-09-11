import { z } from "zod";

export const checkInSchema = z.object({
  token: z.string().min(10, "Invalid QR code token"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

export type CheckInInput = z.infer<typeof checkInSchema>;