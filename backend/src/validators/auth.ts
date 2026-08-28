import { z } from "zod"

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["STUDENT"]).optional(),
  program: z.enum(["CWTS", "ROTC"]),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  studentNo: z.string().optional()
})

export const loginSchema = z.object({
  email: z.string().min(1),
  password: z.string().min(8)
})

export const refreshSchema = z.object({
  refreshToken: z.string().min(10)
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8)
})

export const forgotPasswordSchema = z.object({
  email: z.string().email()
})

export const resetPasswordSchema = z.object({
  ticket: z.string().min(1),
  code: z.string().regex(/^\d{6}$/, "Code must be 6 digits"),
  newPassword: z.string().min(8)
})
