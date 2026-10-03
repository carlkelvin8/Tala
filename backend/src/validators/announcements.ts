import { z } from "zod"

export const announcementCreateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  body: z.string().min(1, "Body is required"),
  program: z.enum(["CWTS", "ROTC"]).optional(),
  eventDate: z.string().datetime({ offset: true }).optional(),
})

export const announcementUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  body: z.string().min(1).optional(),
  program: z.enum(["CWTS", "ROTC"]).nullable().optional(),
  eventDate: z.string().datetime({ offset: true }).nullable().optional(),
})

export const announcementQuerySchema = z.object({
  program: z.enum(["CWTS", "ROTC"]).optional(),
  page: z.string().optional(),
  pageSize: z.string().optional(),
})