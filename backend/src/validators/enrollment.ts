import { z } from "zod"

export const enrollmentCreateSchema = z.object({
  userId: z.string().uuid(),
  sectionId: z.string().uuid().optional(),
  flightId: z.string().uuid().optional()
})

export const enrollmentStatusSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"])
})

export const enrollmentQuerySchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"]).optional(),
  sectionId: z.string().uuid().optional(),
  flightId: z.string().uuid().optional(),
  search: z.string().optional(),
  page: z.string().optional(),
  pageSize: z.string().optional()
})
