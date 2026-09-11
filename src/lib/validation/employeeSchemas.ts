import { z } from "zod";

export const createEmployeeSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Valid email is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  employeeNumber: z.string().optional(),
  department: z.string().optional(),
});

export const updateEmployeeSchema = z.object({
  id: z.string(),
  fullName: z.string().min(2, "Full name is required").optional(),
  email: z.string().email("Valid email is required").optional(),
  department: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const createAdminSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
export type CreateAdminInput = z.infer<typeof createAdminSchema>;