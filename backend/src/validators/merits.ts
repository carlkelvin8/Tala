import { z } from "zod"

export const meritSchema = z.object({
  studentId: z.string().uuid(),
  type: z.enum(["MERIT", "DEMERIT"]),
  points: z.number().int().positive(),
  reason: z.string().min(1)
})

export const meritUpdateSchema = z.object({
  type: z.enum(["MERIT", "DEMERIT"]).optional(),
  points: z.number().int().positive().optional(),
  reason: z.string().min(1).optional()
})

export const meritQuerySchema = z.object({
  studentId: z.string().uuid().optional(),
  type: z.enum(["MERIT", "DEMERIT"]).optional(),
  sectionId: z.string().uuid().optional(),
  page: z.string().optional(),
  pageSize: z.string().optional()
})
