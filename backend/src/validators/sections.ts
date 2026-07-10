import { z } from "zod"

export const sectionSchema = z.object({
  code: z.string().min(2),
  name: z.string().min(2),
  courseId: z.string().uuid().nullable().optional()
})

export const generateSectionsSchema = z.object({
  prefix: z.string().min(1, "Prefix is required"),
  start: z.number().int().min(1, "Start must be at least 1"),
  end: z.number().int().min(1, "End must be at least 1"),
  courseId: z.string().uuid("A valid course is required"),
  separator: z.string().default("-")
}).refine((data) => data.end >= data.start, {
  message: "End must be greater than or equal to start",
  path: ["end"]
}).refine((data) => (data.end - data.start + 1) <= 50, {
  message: "Cannot generate more than 50 sections at once",
  path: ["end"]
})
