import { z } from "zod"

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["ADMIN", "IMPLEMENTOR", "CADET_OFFICER", "STUDENT"]),
  firstName: z.string().min(1),
  lastName: z.string().min(1)
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
})

export const refreshSchema = z.object({
  refreshToken: z.string().min(10)
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8)
})
