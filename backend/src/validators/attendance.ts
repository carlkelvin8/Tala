import { z } from "zod"

export const scanQRSchema = z.object({
  token: z.string().min(1, "QR token is required")
})

export const attendanceQuerySchema = z.object({
  date: z.string().optional(),
  userId: z.string().uuid().optional(),
  sectionId: z.string().uuid().optional(),
  flightId: z.string().uuid().optional(),
  page: z.string().optional(),
  pageSize: z.string().optional()
})
