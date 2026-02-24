import { z } from "zod"

export const attendanceCheckInSchema = z.object({
  latitude: z.number(),
  longitude: z.number()
})

export const attendanceCheckOutSchema = z.object({
  latitude: z.number(),
  longitude: z.number()
})

export const attendanceQuerySchema = z.object({
  date: z.string().optional(),
  userId: z.string().uuid().optional(),
  sectionId: z.string().uuid().optional(),
  flightId: z.string().uuid().optional(),
  page: z.string().optional(),
  pageSize: z.string().optional()
})
