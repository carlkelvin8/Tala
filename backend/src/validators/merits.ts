import { z } from "zod"

export const meritSchema = z.object({
  studentId: z.string().uuid(),
  type: z.enum(["MERIT", "DEMERIT"]),
  points: z.number().int(),
  reason: z.string().min(1)
})

export const meritQuerySchema = z.object({
  studentId: z.string().uuid().optional(),
  type: z.enum(["MERIT", "DEMERIT"]).optional(),
  page: z.string().optional(),
  pageSize: z.string().optional()
})
