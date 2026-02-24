import { z } from "zod"

export const materialCreateSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.enum(["MODULE", "LECTURE", "ANNOUNCEMENT", "ACTIVITY"]),
  fileUrl: z.string().min(1).optional(),
  sectionId: z.string().uuid().optional(),
  flightId: z.string().uuid().optional()
})

export const materialQuerySchema = z.object({
  category: z.enum(["MODULE", "LECTURE", "ANNOUNCEMENT", "ACTIVITY"]).optional(),
  sectionId: z.string().uuid().optional(),
  flightId: z.string().uuid().optional(),
  page: z.string().optional(),
  pageSize: z.string().optional()
})
