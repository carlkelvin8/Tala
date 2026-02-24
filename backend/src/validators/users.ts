import { z } from "zod"

export const userCreateSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["ADMIN", "IMPLEMENTOR", "CADET_OFFICER", "STUDENT"]),
  firstName: z.string().min(1),
  lastName: z.string().min(1)
})

export const userUpdateSchema = z.object({
  role: z.enum(["ADMIN", "IMPLEMENTOR", "CADET_OFFICER", "STUDENT"]).optional(),
  isActive: z.boolean().optional()
})

export const userQuerySchema = z.object({
  role: z.enum(["ADMIN", "IMPLEMENTOR", "CADET_OFFICER", "STUDENT"]).optional(),
  search: z.string().optional(),
  page: z.string().optional(),
  pageSize: z.string().optional()
})
